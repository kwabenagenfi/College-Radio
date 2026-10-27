"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Track } from "@/lib/session";
import { imgOk, useArt } from "@/lib/utils";
import { Cover } from "./Cards";

export const ICON = {
  play: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" /></svg>
  ),
  pause: (
    <svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1.2" /><rect x="14" y="4" width="5" height="16" rx="1.2" /></svg>
  ),
  stop: (
    <svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="3" /></svg>
  ),
};

/* Your circle picture (falls back to a gradient "B") */
export function Avatar({ src, onClick, size }: { src: string; onClick?: () => void; size?: number }) {
  const s = size ? { width: size, height: size } : undefined;
  const [ok, setOk] = useState(false);
  useEffect(() => {
    let alive = true;
    imgOk(src).then((v) => alive && setOk(v));
    return () => {
      alive = false;
    };
  }, [src]);
  return (
    <button className="avatar" style={s} onClick={onClick} aria-label="About bearkFM">
      {ok ? <img src={src} alt="" /> : "B"}
    </button>
  );
}

/* Glass bearkFM card that drops from your picture */
export function About({
  open, onClose, avatar, show, status, live, text,
}: {
  open: boolean; onClose: () => void; avatar: string; show: string; status: string; live: boolean; text: string;
}) {
  return (
    <div className={`about${open ? " open" : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ab-card">
        <div className="ab-head">
          <Avatar src={avatar} size={58} />
          <div>
            <div className="ab-name">beark<span>FM</span></div>
            <div className="ab-show">{show}</div>
          </div>
        </div>
        <div className={`ab-status${live ? " live" : ""}`}>{status}</div>
        <p className="ab-text">{text}</p>
      </div>
    </div>
  );
}

/* Floating player at the bottom */
export function MiniPlayer({
  track, title, sub, icon, disabled, onToggle, onOpen,
}: {
  track: Track | null; title: string; sub: ReactNode; icon: ReactNode; disabled: boolean; onToggle: () => void; onOpen: () => void;
}) {
  return (
    <div className="mini">
      <button className="thumb" onClick={onOpen}><Cover track={track} size={16} /></button>
      <button className="meta" onClick={onOpen} aria-label="Open player">
        <div className="m1">{title}</div>
        <div className="m2">{sub}</div>
      </button>
      <button className="cta" onClick={onToggle} disabled={disabled}>{icon}</button>
    </div>
  );
}

/* Apple Music style song page (top) with the radio player (bottom) */
export function SongSheet({
  open, track, fallbackTitle, fallbackSub, canJump, onJump, onChoose, onClose,
  dockTitle, dockSub, progress, bigIcon, bigDisabled, onToggle,
}: {
  open: boolean; track: Track | null; fallbackTitle: string; fallbackSub: string;
  canJump: boolean; onJump: () => void; onChoose: () => void; onClose: () => void;
  dockTitle: string; dockSub: string; progress: ReactNode; bigIcon: ReactNode; bigDisabled: boolean; onToggle: () => void;
}) {
  const url = useArt(track);
  const startY = useRef<number | null>(null);
  const bg = url ? `url("${url}")` : "radial-gradient(circle at 30% 30%,#2bff8855,#9b6bff55,#000)";

  const share = async () => {
    const link = location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: fallbackTitle, url: link });
      else await navigator.clipboard.writeText(link);
    } catch { }
  };

  return (
    <div
      className={`sheet${open ? " open" : ""}`}
      onTouchStart={(e) => (startY.current = e.touches[0].clientY)}
      onTouchEnd={(e) => {
        if (startY.current !== null && e.changedTouches[0].clientY - startY.current > 80) onClose();
        startY.current = null;
      }}
    >
      <div className="bgart" style={{ backgroundImage: bg }} />
      <div className="hero">
        <div className="heroimg" style={{ backgroundImage: bg }} />
        <div className="herofade" />
        <div className="topbar">
          <button className="gbtn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <div className="gpill">
            <button onClick={share} aria-label="Share">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 8l5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
            </button>
          </div>
        </div>
        <div className="heroinfo">
          <div className="h-title">{track ? track.album ?? `${track.title} - Single` : fallbackTitle}</div>
          <div className="h-artist">{track ? track.artist : fallbackSub}</div>
          <div className="h-meta">{track ? [track.genre, track.year].filter(Boolean).join(" · ") : "bearkFM"}</div>
          <div className="h-actions">
            <button className={`gcirc${canJump ? "" : " off"}`} onClick={onJump} aria-label="Play this part of the mix">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="2.2" fill="#fff" /><path d="M8 8a5.5 5.5 0 0 0 0 8M16 8a5.5 5.5 0 0 1 0 8M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" /></svg>
            </button>
            <button className="playpill" onClick={onChoose} style={{ visibility: track ? "visible" : "hidden" }}>
              {ICON.play}Play
            </button>
            <button className={`gcirc${track ? "" : " off"}`} onClick={onChoose} aria-label="Add">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
        </div>
      </div>
      <div className="dock">
        <div className="grab" />
        <div className="srow">
          <div className="st">{dockTitle}</div>
          <div className="sa">{dockSub}</div>
        </div>
        <div className="prog">{progress}</div>
        <button className="bigbtn" onClick={onToggle} disabled={bigDisabled} aria-label="Play">{bigIcon}</button>
      </div>
    </div>
  );
}

/* Glass picker: Apple Music / Spotify / YouTube Music */
export function Chooser({ track, onClose }: { track: Track | null; onClose: () => void }) {
  const url = useArt(track);
  let q = "";
  if (track) {
    const song = track.title.replace(/\s*\((Extended|Remix)\)/i, (m) => (/remix/i.test(m) ? " Remix" : ""));
    const who = track.artist.split(/ ft\.| feat\.|,| & /)[0];
    q = encodeURIComponent(`${song} ${who}`);
  }
  const links = [
    { name: "Apple Music", href: `https://music.apple.com/us/search?term=${q}`, style: { background: "linear-gradient(135deg,#ff5f6d,#fa233b)" }, glyph: "♪" },
    { name: "Spotify", href: `https://open.spotify.com/search/${q}`, style: { background: "#1ed760", color: "#000" }, glyph: "♪" },
    { name: "YouTube Music", href: `https://music.youtube.com/search?q=${q}`, style: { background: "#ff0033" }, glyph: "▶" },
  ];
  return (
    <div className={`chooser${track ? " open" : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ch-card">
        <div className="ch-head">
          {url ? <img src={url} alt="" /> : <span className="ch-blank" />}
          <div><b>{track?.title}</b><span>{track?.artist}</span></div>
        </div>
        {links.map((l) => (
          <a key={l.name} className="ch-row" href={l.href} target="_blank" rel="noopener" onClick={() => setTimeout(onClose, 300)}>
            <i style={l.style}>{l.glyph}</i>{l.name}<span className="go">›</span>
          </a>
        ))}
      </div>
      <button className="ch-cancel" onClick={onClose}>Cancel</button>
    </div>
  );
}
