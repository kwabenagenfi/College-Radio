"use client";

import { useEffect, useRef, useState } from "react";
import { session as S, type MixTrack, type Track } from "@/lib/session";
import { ago, artFor, clock, fmt, toSec } from "@/lib/utils";
import { HeavyCard, Rail, Tile } from "./Cards";
import { About, Avatar, Chooser, ICON, MiniPlayer, SongSheet } from "./Overlays";

type Phase = "soon" | "live" | "replay" | "expired";
type Mode = "live" | "replay" | null;
type MixItem = MixTrack & { i: number; sec: number; ref?: MixItem | null };

// The mix tracklist, sorted, with each "again" entry pointing at its first play
const tracks: MixItem[] = S.tracks
  .map((t, i) => ({ ...t, i, sec: toSec(t.at) }))
  .sort((a, b) => a.sec - b.sec);
tracks.forEach((t) => {
  if (t.again) t.ref = tracks.find((o) => !o.again && o.title === t.title) ?? null;
});
const LEN = S.lengthMinutes * 60;

const currentTrack = (pos: number) => {
  let c: MixItem | null = null;
  for (const t of tracks) if (t.sec <= pos) c = t;
  return c?.again && c.ref ? c.ref : c;
};
const mixSecOf = (t: Track | null) =>
  t ? tracks.find((o) => !o.again && o.title === t.title && o.artist === t.artist)?.sec ?? null : null;

export default function Radio() {
  /* ---------- clock ---------- */
  // ?ago=10 in the URL pretends the session started 10 minutes ago (for testing)
  const [times, setTimes] = useState<{ start: number; until: number; loadedAt: number } | null>(null);
  const [now, setNow] = useState(0);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const mq = matchMedia("(min-width: 900px)");
    const onMq = () => setWide(mq.matches);
    const boot = setTimeout(() => {
      const p = new URLSearchParams(location.search);
      let start = new Date(S.start).getTime();
      let until = new Date(S.availableUntil).getTime();
      if (p.has("ago")) {
        start = Date.now() - parseFloat(p.get("ago")!) * 60000;
        until = start + 864e5;
      }
      setTimes({ start, until, loadedAt: Date.now() });
      setNow(Date.now());
      onMq();
    }, 0);
    const id = setInterval(() => setNow(Date.now()), 1000);
    mq.addEventListener("change", onMq);
    return () => {
      clearTimeout(boot);
      clearInterval(id);
      mq.removeEventListener("change", onMq);
    };
  }, []);

  /* ---------- audio ---------- */
  const audioRef = useRef<HTMLAudioElement>(null);
  const modeRef = useRef<Mode>(null);
  const metaReady = useRef(false);
  const [mode, setModeState] = useState<Mode>(null);
  const [playing, setPlaying] = useState(false);
  const [curTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const setMode = (m: Mode) => {
    modeRef.current = m;
    setModeState(m);
  };

  /* ---------- overlays ---------- */
  const [aboutOpen, setAboutOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pageTrack, setPageTrack] = useState<Track | null>(null);
  const [chooserTrack, setChooserTrack] = useState<Track | null>(null);

  const start = times?.start ?? 0;
  const end = start + LEN * 1000;
  const phase: Phase | null = !times
    ? null
    : now >= times.until ? "expired" : now < start ? "soon" : now < end ? "live" : "replay";
  const liveElapsed = () => (Date.now() - start) / 1000;

  // where in the mix the page should be showing
  const pos =
    phase === "soon" ? -1
      : phase === "live" && mode !== "replay" ? (now - start) / 1000
        : mode === "replay" ? curTime
          : LEN;
  const cur = phase ? currentTrack(pos) : null;

  const ensureSrc = (a: HTMLAudioElement) => {
    if (!a.src.endsWith(S.audio)) {
      metaReady.current = false;
      a.src = S.audio;
      a.preload = "auto";
    }
  };
  const joinLive = () => {
    const a = audioRef.current!;
    setMode("live");
    ensureSrc(a);
    if (metaReady.current) a.currentTime = liveElapsed();
    a.play().catch(() => { });
  };
  const startReplay = (at: number | null = null) => {
    const a = audioRef.current!;
    if (modeRef.current === "live") a.pause();
    setMode("replay");
    ensureSrc(a);
    if (at !== null) {
      if (metaReady.current) a.currentTime = at;
      else a.addEventListener("loadedmetadata", () => (a.currentTime = at), { once: true });
    }
    a.play().catch(() => { });
  };
  const toggle = () => {
    const a = audioRef.current!;
    if (!a.paused) return a.pause();
    if (phase === "live") joinLive();
    else if (phase === "replay") {
      if (modeRef.current !== "replay") startReplay(0);
      else a.play();
    }
  };

  // every second: keep live listeners locked to real time, handle phase changes
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !phase) return;
    if (phase === "expired") a.pause();
    if (phase === "live" && modeRef.current === "live" && !a.paused && metaReady.current && Math.abs(a.currentTime - liveElapsed()) > 3)
      a.currentTime = liveElapsed();
    if (phase === "replay" && modeRef.current === "live" && a.paused) setMode(null);
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  // lock screen / control centre info
  useEffect(() => {
    if (!playing || !("mediaSession" in navigator) || !phase) return;
    const t = cur;
    (async () => {
      const art = t ? await artFor(t) : null;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t ? t.title : S.title,
        artist: phase === "live" ? `● LIVE · ${S.title}` : `${t ? t.artist + " · " : ""}${S.title}`,
        album: "Transatlantic Radio",
        artwork: art ? [{ src: new URL(art, location.href).href, sizes: "600x600", type: "image/jpeg" }] : [],
      });
      const seek = phase !== "live";
      try {
        navigator.mediaSession.setActionHandler("seekto", seek ? (d) => (audioRef.current!.currentTime = d.seekTime ?? 0) : null);
        navigator.mediaSession.setActionHandler("seekbackward", seek ? () => (audioRef.current!.currentTime -= 15) : null);
        navigator.mediaSession.setActionHandler("seekforward", seek ? () => (audioRef.current!.currentTime += 15) : null);
      } catch { }
    })();
  }, [cur?.i, phase, playing]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- recently played tiles ---------- */
  const visible = phase
    ? (phase === "replay" ? tracks : tracks.filter((t) => t.sec <= pos)).filter((t) => !t.again)
    : [];
  const ordered = phase === "live" ? [...visible].reverse() : visible;
  // tiles that were already played when the page opened don't animate in
  const loadedPos = times ? (times.loadedAt - start) / 1000 : 0;

  /* ---------- labels ---------- */
  const live = phase === "live";
  const status =
    phase === "soon" ? `Today at ${clock(start)}`
      : phase === "live" ? "Live Now"
        : phase === "replay" ? `Aired ${ago(now - end)}`
          : "";

  let miniTitle = S.title;
  let miniSub: React.ReactNode = status;
  let icon = ICON.play;
  if (phase === "live") {
    miniTitle = cur?.title ?? S.title;
    miniSub = <><span className="lv">LIVE</span> · {cur?.artist ?? "Bearkington"}</>;
    icon = playing && mode === "live" ? ICON.stop : ICON.play;
  } else if (phase === "replay") {
    miniTitle = mode === "replay" && cur ? cur.title : S.title;
    icon = playing ? ICON.pause : ICON.play;
  }

  const d = duration || LEN;
  const c = mode === "replay" ? curTime : 0;
  const progress =
    phase === "replay" ? (
      <>
        <input
          type="range" min={0} max={1000} value={Math.round((c / d) * 1000)}
          onChange={(e) => {
            if (modeRef.current !== "replay") startReplay(0);
            audioRef.current!.currentTime = (Number(e.target.value) / 1000) * d;
          }}
        />
        <div className="times"><span>{fmt(c)}</span><span>-{fmt(d - c)}</span></div>
      </>
    ) : (
      <div className="liveline">{live ? "LIVE" : "SOON"}</div>
    );

  const openSong = (t: Track | null) => {
    setPageTrack(t);
    setSheetOpen(true);
  };
  const jumpSec = mixSecOf(pageTrack);

  return (
    <>
      {wide && <video className="bgvid" src={S.background} autoPlay muted loop playsInline />}
      <div className="edge" />
      <div className="ambient"><i /><i /></div>

      <div className={`wrap${phase === "expired" ? " expired" : ""}`}>
        <div className="pull">Transatlantic Radio</div>
        <header className="top">
          <div>
            <div className={`eyebrow${live ? " live" : ""}`} onClick={() => setAboutOpen(true)}>{status}</div>
            <h1>Beark FM</h1>
          </div>
          <Avatar src={S.avatar} onClick={() => setAboutOpen(true)} />
        </header>

        {phase === "expired" ? (
          <div className="ended">
            <h1>That one&apos;s gone.</h1>
            <p>Today&apos;s session ended. Watch the story for the next link.</p>
          </div>
        ) : (
          <main>
            <section className="section">
              <h2>Heavy Rotation</h2>
              <Rail count={S.heavyRotation.length}>
                {S.heavyRotation.map((t) => (
                  <HeavyCard key={t.title + t.artist} track={t} onOpen={() => openSong(t)} />
                ))}
              </Rail>
            </section>

            <section className="section">
              <h2>Recently Played <Chevron /></h2>
              <Rail count={ordered.length}>
                {ordered.length === 0 && phase && (
                  <div className="empty">
                    {phase === "soon" ? "Tracks show up here once the session starts." : "First track loading…"}
                  </div>
                )}
                {ordered.map((t) => (
                  <Tile
                    key={t.i}
                    track={t}
                    animate={phase === "live" && t.sec > loadedPos}
                    playing={playing && cur?.i === t.i}
                    onOpen={() => openSong(t)}
                  />
                ))}
              </Rail>
            </section>

            <section className="section">
              <h2>More For Today <Chevron /></h2>
              <Rail count={S.moreToday.length}>
                {S.moreToday.map((t) => (
                  <Tile key={t.title + t.artist} track={t} onOpen={() => openSong(t)} />
                ))}
              </Rail>
            </section>

            <footer>Up today only · bearkFM</footer>
          </main>
        )}
      </div>

      {phase && phase !== "expired" && (
        <MiniPlayer
          track={cur}
          title={miniTitle}
          sub={miniSub}
          icon={icon}
          disabled={phase === "soon"}
          onToggle={toggle}
          onOpen={() => openSong(cur)}
        />
      )}

      <About
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        avatar={S.avatar}
        show={S.title}
        status={status}
        live={live}
        text={S.about}
      />

      <SongSheet
        open={sheetOpen}
        track={pageTrack}
        fallbackTitle={S.title}
        fallbackSub={S.subtitle}
        canJump={jumpSec !== null && phase === "replay"}
        onJump={() => jumpSec !== null && startReplay(jumpSec)}
        onChoose={() => setChooserTrack(pageTrack)}
        onClose={() => setSheetOpen(false)}
        dockTitle={cur?.title ?? S.title}
        dockSub={cur?.artist ?? S.subtitle}
        progress={progress}
        bigIcon={playing ? (live && mode === "live" ? ICON.stop : ICON.pause) : ICON.play}
        bigDisabled={phase === "soon"}
        onToggle={toggle}
      />

      <Chooser track={chooserTrack} onClose={() => setChooserTrack(null)} />

      <audio
        ref={audioRef}
        preload="none"
        playsInline
        onLoadedMetadata={(e) => {
          metaReady.current = true;
          setDuration(e.currentTarget.duration);
          if (modeRef.current === "live") e.currentTarget.currentTime = liveElapsed();
        }}
        onTimeUpdate={(e) => setCurTime(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setMode(null);
        }}
        onSeeked={(e) => {
          if (modeRef.current === "live" && phase === "live" && Math.abs(e.currentTarget.currentTime - liveElapsed()) > 3)
            e.currentTarget.currentTime = liveElapsed();
        }}
      />
    </>
  );
}

function Chevron() {
  return (
    <svg width="12" height="20" viewBox="0 0 12 20">
      <path d="M2 2l8 8-8 8" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
