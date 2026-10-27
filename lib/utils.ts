import { useEffect, useState } from "react";
import type { Track } from "./session";

/* ---------- time ---------- */
export const toSec = (s: string) => {
  const p = s.split(":").map(Number);
  return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
};
export const fmt = (s: number) => {
  s = Math.max(0, Math.floor(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
export const clock = (ms: number) =>
  new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
export const ago = (ms: number) => {
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return `${h} hr${h > 1 ? "s" : ""} ago`;
};

/* ---------- covers ---------- */
export const initials = (t: Track) =>
  t.artist.replace(/[^A-Za-z0-9 ]/g, "").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export const imgOk = (u: string) =>
  new Promise<boolean>((r) => {
    const im = new Image();
    im.onload = () => r(true);
    im.onerror = () => r(false);
    im.src = u;
  });

/* ---------- Apple Music lookup (cover + direct song link) ---------- */
type Lookup = { art: string | null; url: string | null };
const lookupCache = new Map<string, Promise<Lookup>>();
const searchTerm = (t: Track) =>
  `${t.title.replace(/\s*\((Extended)\)/i, "")} ${t.artist.split(/ ft\.| feat\.|,| & /)[0]}`;

export function appleLookup(t: Track) {
  const key = `${t.artist}|${t.title}`;
  if (!lookupCache.has(key)) {
    lookupCache.set(
      key,
      (async () => {
        try {
          const q = encodeURIComponent(searchTerm(t));
          const r = await fetch(`https://itunes.apple.com/search?term=${q}&entity=song&limit=1`);
          const j = await r.json();
          const hit = j.results?.[0];
          return {
            art: hit?.artworkUrl100 ? String(hit.artworkUrl100).replace("100x100bb", "600x600bb") : null,
            url: hit?.trackViewUrl ?? null,
          };
        } catch {
          return { art: null, url: null };
        }
      })()
    );
  }
  return lookupCache.get(key)!;
}

// Direct Apple Music link for a song (falls back to an Apple Music search)
export async function appleMusicUrl(t: Track) {
  const { url } = await appleLookup(t);
  return url ?? `https://music.apple.com/us/search?term=${encodeURIComponent(searchTerm(t))}`;
}
export const youtubeMusicUrl = (t: Track) =>
  `https://music.youtube.com/search?q=${encodeURIComponent(searchTerm(t))}`;

const artCache = new Map<string, Promise<string | null>>();

// Your local cover if it exists, otherwise Apple Music's
export function artFor(t: Track) {
  const key = `${t.artist}|${t.title}|${t.art ?? ""}`;
  if (!artCache.has(key)) {
    artCache.set(
      key,
      (async () => {
        if (t.art && (await imgOk(t.art))) return t.art;
        if (t.art?.startsWith("/mix/works/")) return null; // your own art: no lookup
        return (await appleLookup(t)).art;
      })()
    );
  }
  return artCache.get(key)!;
}

export function useArt(t: Track | null | undefined) {
  const [state, setState] = useState<{ key: string; url: string | null }>({ key: "", url: null });
  const key = t ? `${t.artist}|${t.title}|${t.art ?? ""}` : "";
  useEffect(() => {
    if (!t) return;
    let alive = true;
    artFor(t).then((url) => alive && setState({ key, url }));
    return () => {
      alive = false;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return state.key === key ? state.url : null;
}

// Main colour of a cover, darkened if needed so white text stays readable
export function mainColour(url: string) {
  return new Promise<[number, number, number]>((res) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = c.height = 32;
        const x = c.getContext("2d")!;
        x.drawImage(im, 0, 0, 32, 32);
        const d = x.getImageData(0, 0, 32, 32).data;
        const buckets: Record<string, { w: number; r: number; g: number; b: number }> = {};
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
          const lum = (r + g + b) / 3;
          if (lum < 20 || lum > 235) continue;
          const w = 1 + (mx ? (mx - mn) / mx : 0) * 3;
          const k = `${r >> 5},${g >> 5},${b >> 5}`;
          const B = (buckets[k] ??= { w: 0, r: 0, g: 0, b: 0 });
          B.w += w; B.r += r * w; B.g += g * w; B.b += b * w;
        }
        let best: { w: number; r: number; g: number; b: number } | null = null;
        for (const k in buckets) if (!best || buckets[k].w > best.w) best = buckets[k];
        if (!best) return res([42, 42, 42]);
        let col = [best.r / best.w, best.g / best.w, best.b / best.w];
        const L = (0.2126 * col[0] + 0.7152 * col[1] + 0.0722 * col[2]) / 255;
        if (L > 0.45) col = col.map((v) => (v * 0.45) / L);
        res(col.map(Math.round) as [number, number, number]);
      } catch {
        res([42, 42, 42]);
      }
    };
    im.onerror = () => res([42, 42, 42]);
    im.src = url;
  });
}

/* ---------- share link (works on http too) ---------- */
export async function shareLink(title: string, url: string): Promise<"shared" | "copied" | "failed"> {
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return "shared";
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") return "shared"; // they closed the share sheet
  }
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      return "copied";
    }
  } catch {}
  // old-school copy for plain http (like testing on 192.168.x.x)
  const box = document.createElement("textarea");
  box.value = url;
  box.setAttribute("readonly", "");
  box.style.position = "fixed";
  box.style.opacity = "0";
  document.body.appendChild(box);
  box.select();
  box.setSelectionRange(0, url.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {}
  box.remove();
  return ok ? "copied" : "failed";
}

/* ---------- password check (SHA-256, works on http too) ---------- */
export function sha256(text: string) {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const bytes = Array.from(new TextEncoder().encode(text));
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push(i > 3 ? 0 : (bitLen >>> (i * 8)) & 0xff);
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < bytes.length; o += 64) {
    const w = new Array<number>(64);
    for (let i = 0; i < 16; i++)
      w[i] = (bytes[o + i * 4] << 24) | (bytes[o + i * 4 + 1] << 16) | (bytes[o + i * 4 + 2] << 8) | bytes[o + i * 4 + 3];
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
}
