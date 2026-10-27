"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import type { Artist, Work } from "@/lib/session";
import { imgOk, sha256 } from "@/lib/utils";
import { ICON } from "./Overlays";

const LOCK = (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10V7a5 5 0 0 1 10 0v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1zm2 0h6V7a3 3 0 0 0-6 0v3z" /></svg>
);
const BACK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
);

/* "2026-10-10" → "Oct 10, 2026" */
const releaseDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/* Cover image that quietly shows a gradient until the file exists */
function Art({ src, label }: { src?: string; label: string }) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    let alive = true;
    if (src) imgOk(src).then((v) => alive && setOk(v));
    return () => {
      alive = false;
    };
  }, [src]);
  return ok ? <img src={src} alt="" /> : <div className="art-ph">{label}</div>;
}

/* Square card for an album / EP in the Beark row */
export function WorkCard({ work, playing, onOpen }: { work: Work; playing: boolean; onOpen: () => void }) {
  return (
    <button className={`tile${playing ? " playing" : ""}`} onClick={onOpen}>
      <div className="art">
        <Art src={work.art} label={work.title} />
        <div className="now"><span className="bars"><i /><i /><i /></span>NOW</div>
      </div>
      <div className="t">{work.title}</div>
      <div className="a">{work.kind} · {work.year ?? "Coming soon"}</div>
    </button>
  );
}

/* Apple Music style album page */
export function AlbumSheet({
  work, unlocked, nowIndex, playing, onClose, onPlay, onTrack, onUnlock, onArtist,
}: {
  work: Work | null; unlocked: boolean; nowIndex: number | null; playing: boolean;
  onClose: () => void; onPlay: () => void; onTrack: (i: number) => void; onUnlock: () => void; onArtist: () => void;
}) {
  const [shown, setShown] = useState<Work | null>(work);
  if (work && work !== shown) setShown(work); // keep content while sliding out
  const w = work ?? shown;
  return (
    <div className={`page album${work ? " open" : ""}`}>
      {w && (
        <>
          <div className="page-bar">
            <button className="gbtn" onClick={onClose} aria-label="Back">{BACK}</button>
          </div>
          <div className="album-head">
            <div className="album-art"><Art src={w.art} label={w.title} /></div>
            <h2 className="album-title">{w.title}</h2>
            <button className="album-artist" onClick={onArtist}>{w.artist}</button>
            <div className="album-meta">
              {w.kind} · {w.released ? releaseDate(w.released) : w.year}
            </div>
            <div className="album-actions">
              <button className="apill" onClick={onPlay}>
                {playing ? <>{ICON.pause}Pause</> : <>{ICON.play}{unlocked ? "Play" : "Preview"}</>}
              </button>
              {!unlocked && (
                <button className="apill" onClick={onUnlock}>{LOCK}Unlock</button>
              )}
            </div>
          </div>
          <ol className="tracklist">
            {w.tracks.map((t, i) => {
              const now = nowIndex === i;
              return (
                <li key={i}>
                  <button className={`trow${now ? " now" : ""}`} onClick={() => onTrack(i)}>
                    <span className="tnum">
                      {now && playing ? <span className="bars"><i /><i /><i /></span> : i + 1}
                    </span>
                    <span className="tname">{unlocked ? t.title : `Track ${i + 1}`}</span>
                    {!unlocked && !(i === 0 && w.preview) && <span className="tlock">{LOCK}</span>}
                    {!unlocked && i === 0 && w.preview && <span className="tprev">PREVIEW</span>}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="album-foot">
            {w.songCount ?? `${w.tracks.length} songs`} · {unlocked ? "Unlocked" : "Tracklist hidden until release"}
          </div>
        </>
      )}
    </div>
  );
}

/* Artist profile (add a photo after your photoshoot) */
export function ArtistSheet({
  open, artist, works, onClose, onWork,
}: {
  open: boolean; artist: Artist; works: Work[]; onClose: () => void; onWork: (w: Work) => void;
}) {
  return (
    <div className={`page artist${open ? " open" : ""}`}>
      <div className="page-bar">
        <button className="gbtn" onClick={onClose} aria-label="Back">{BACK}</button>
      </div>
      <div className="artist-hero">
        <Art src={artist.photo} label="" />
        <div className="artist-fade" />
        <h2 className="artist-name">{artist.name}</h2>
      </div>
      <p className="artist-bio">{artist.bio}</p>
      <h3 className="artist-h">Albums &amp; EPs</h3>
      <div className="artist-grid">
        {works.map((w) => (
          <button key={w.id} className="tile" onClick={() => onWork(w)}>
            <div className="art"><Art src={w.art} label={w.title} /></div>
            <div className="t">{w.title}</div>
            <div className="a">{w.kind} · {w.year ?? "Coming soon"}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* iOS style password alert */
export function PasswordPrompt({
  open, hash, onCancel, onSuccess,
}: {
  open: boolean; hash: string; onCancel: () => void; onSuccess: () => void;
}) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 250);
  }, [open]);

  const submit = () => {
    if (sha256(value.trim()) === hash) {
      setValue("");
      onSuccess();
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
  };

  return (
    <div className={`pw${open ? " open" : ""}`}>
      <form
        className={`pw-card${shake ? " shake" : ""}`}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="pw-title">Enter Password</div>
        <div className="pw-text">This music isn&apos;t out yet. Enter the password to keep listening.</div>
        <input
          ref={input}
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Password"
          autoComplete="off"
        />
        <div className="pw-btns">
          <button
            type="button"
            onClick={() => {
              setValue("");
              onCancel();
            }}
          >
            Cancel
          </button>
          <button type="submit" className="pw-ok">Unlock</button>
        </div>
      </form>
    </div>
  );
}

/* Small message that fades out */
export function Toast({ text }: { text: string | null }) {
  return <div className={`toast${text ? " show" : ""}`}>{text}</div>;
}
