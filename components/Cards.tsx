"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Track } from "@/lib/session";
import { initials, mainColour, useArt } from "@/lib/utils";

/* Square cover with initials while it loads */
export function Cover({ track, size = 36 }: { track: Track | null; size?: number }) {
  const url = useArt(track);
  if (url) return <img src={url} alt="" />;
  return (
    <div className="ph" style={{ fontSize: size }}>
      {track ? initials(track) : "FM"}
    </div>
  );
}

/* Tall Heavy Rotation card tinted by the cover's main colour */
export function HeavyCard({ track, onOpen }: { track: Track; onOpen: () => void }) {
  const url = useArt(track);
  const [rgb, setRgb] = useState<[number, number, number] | null>(null);

  useEffect(() => {
    if (url) mainColour(url).then(setRgb);
  }, [url]);

  const style = rgb
    ? ({
      "--c": `rgb(${rgb.join(",")})`,
      "--lab": `rgb(${rgb.map((v) => Math.round(v + (255 - v) * 0.55)).join(",")})`,
    } as React.CSSProperties)
    : undefined;

  return (
    <button className="hcard" style={style} onClick={onOpen}>
      <div className="cov" style={url ? { backgroundImage: `url("${url}")` } : undefined} />
      <div className="fade" />
      <div className="txt">
        <div className="lab">{track.label ?? "Heavy Rotation"}</div>
        <div className="ht">{track.album ?? `${track.title} - Single`}</div>
        <div className="ha">{track.artist}</div>
      </div>
    </button>
  );
}

/* Square tile (Recently Played / More For Today) */
export function Tile({
  track,
  animate = false,
  playing = false,
  onOpen,
}: {
  track: Track;
  animate?: boolean;
  playing?: boolean;
  onOpen: () => void;
}) {
  return (
    <button className={`tile${animate ? " enter" : ""}${playing ? " playing" : ""}`} onClick={onOpen}>
      <div className="art">
        <Cover track={track} />
        <div className="now">
          <span className="bars"><i /><i /><i /></span>NOW
        </div>
      </div>
      <div className="t">{track.title}</div>
      <div className="a">{track.artist}</div>
    </button>
  );
}

/* Horizontal row that tilts its cards in 3D as you scroll */
export function Rail({ children, count }: { children: ReactNode; count: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rail = ref.current;
    if (!rail) return;
    const tilt = () => {
      const r = rail.getBoundingClientRect();
      const mid = r.left + r.width / 2;
      rail.querySelectorAll<HTMLElement>(".tile,.hcard").forEach((el) => {
        const b = el.getBoundingClientRect();
        const d = (b.left + b.width / 2 - mid) / r.width;
        el.style.transform = `rotateY(${d * -22}deg) translateZ(${-Math.abs(d) * 50}px)`;
      });
    };
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tilt);
    };
    tilt();
    rail.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      rail.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count]);

  return (
    <div className="rail" ref={ref}>
      {children}
    </div>
  );
}
