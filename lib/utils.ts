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

const artCache = new Map<string, Promise<string | null>>();

// Your local cover if it exists, otherwise Apple Music's
export function artFor(t: Track) {
  const key = `${t.artist}|${t.title}`;
  if (!artCache.has(key)) {
    artCache.set(
      key,
      (async () => {
        if (t.art && (await imgOk(t.art))) return t.art;
        try {
          const q = encodeURIComponent(`${t.artist.split(/ ft\.| feat\./)[0]} ${t.title}`);
          const r = await fetch(`https://itunes.apple.com/search?term=${q}&entity=song&limit=1`);
          const j = await r.json();
          const u: string | undefined = j.results?.[0]?.artworkUrl100;
          return u ? u.replace("100x100bb", "600x600bb") : null;
        } catch {
          return null;
        }
      })()
    );
  }
  return artCache.get(key)!;
}

export function useArt(t: Track | null | undefined) {
  const [state, setState] = useState<{ key: string; url: string | null }>({ key: "", url: null });
  const key = t ? `${t.artist}|${t.title}` : "";
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
