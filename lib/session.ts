// TODAY'S SESSION — the only file you edit each day.

export type Track = {
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  year?: number;
  art?: string;
  label?: string;
};

export type MixTrack = Track & {
  at: string;
  again?: boolean;
};

// Your own music (Beark the artist, separate from the DJ radio)
export type WorkTrack = {
  title: string; // hidden as "Track 1, Track 2…" until someone unlocks
  audio?: string; // leave out until the track is mastered
};

export type Work = {
  id: string;
  kind: "Album" | "EP" | "Single";
  title: string;
  artist: string;
  year?: number;
  released?: string; // release date, YYYY-MM-DD
  art: string;
  preview?: string; // 30-second preview anyone can hear
  songCount?: string; // optional label like "3.5 songs"
  tracks: WorkTrack[];
};

export type Artist = {
  name: string;
  photo?: string; // add after your photoshoot
  bio: string;
};

export type Session = {
  title: string;
  subtitle: string;
  about: string;
  avatar: string;
  start: string;
  lengthMinutes: number;
  availableUntil: string;
  audio: string;
  background: string;
  heavyRotation: Track[];
  tracks: MixTrack[];
  moreToday: Track[];
  artist: Artist;
  works: Work[];
  unlockHash: string;
};

export const session: Session = {
  title: "Tuesday Pre-Work DJ Playlist",
  subtitle: "Bearkington · Transatlantic Radio",
  about:
    "35 minutes of Afrobeats into Amapiano to get you out the door. Asake, Blaqbonez and Victony up top, a Tyler ICU run in the middle, Mr Eazi and NO11 to land it.",
  avatar: "/mix/me.jpg",
  start: "2026-10-27T03:15:00-04:00",
  lengthMinutes: 35.25,
  availableUntil: "2026-10-27T23:59:00-04:00",
  audio: "/mix/monday-night-pregame.m4a",
  background: "/mix/background.mp4",
  heavyRotation: [
    { label: "Heavy Rotation", title: "WHY LOVE", artist: "Asake", genre: "Amapiano", year: 2025, art: "/mix/covers/why-love.jpg" },
    { label: "On Repeat", title: "SLICK", artist: "Victony", genre: "Afrobeats", year: 2026, art: "/mix/covers/slick.jpg" },
    { label: "Can't Skip", title: "Chanel", artist: "Blaqbonez ft. Asake", genre: "Afrobeats", year: 2026, art: "/mix/covers/chanel.jpg" },
    { label: "Amapiano Pick", title: "Uzwile Bathini", artist: "Khalil Harrison ft. Tyler ICU, Mr Nation Thingz & Ceeka RSA", genre: "Amapiano", year: 2024, art: "/mix/covers/uzwile-bathini.jpg" },
    { label: "New This Month", title: "Comfort", artist: "Mr Eazi ft. MOLIY", genre: "Afrobeats", year: 2026, art: "/mix/covers/comfort.jpg" },
  ],
  tracks: [
    { at: "0:00", title: "IKEBE 3000", artist: "Blaqbonez ft. Asake", genre: "Afrobeats", year: 2026, art: "/mix/covers/ikebe-3000.jpg" },
    { at: "5:01", title: "Chanel", artist: "Blaqbonez ft. Asake", genre: "Afrobeats", year: 2026, art: "/mix/covers/chanel.jpg" },
    { at: "5:31", title: "Move", artist: "Shoday", genre: "Afrobeats", art: "/mix/covers/move.jpg" },
    { at: "7:37", title: "WHY LOVE", artist: "Asake", genre: "Amapiano", year: 2025, art: "/mix/covers/why-love.jpg" },
    { at: "10:30", title: "Mnike", artist: "Tyler ICU & Tumela_za ft. DJ Maphorisa, Nandipha808, Ceeka RSA & Tyrone Dee", genre: "Amapiano", year: 2023, art: "/mix/covers/mnike.jpg" },
    { at: "13:57", title: "Bella Ciao", artist: "Nicole Elocin, Tyler ICU & Ndlovu Youth Choir", album: "Money Heist", genre: "Amapiano", year: 2020, art: "/mix/covers/bella-ciao.jpg" },
    { at: "15:16", title: "Mnike", artist: "Tyler ICU & Tumela_za ft. DJ Maphorisa, Nandipha808, Ceeka RSA & Tyrone Dee", again: true },
    { at: "15:55", title: "Uzwile Bathini", artist: "Khalil Harrison ft. Tyler ICU, Mr Nation Thingz & Ceeka RSA", genre: "Amapiano", year: 2024, art: "/mix/covers/uzwile-bathini.jpg" },
    { at: "18:12", title: "Jealousy", artist: "Khalil Harrison & Tyler ICU ft. LeeMcKrazy & Ceeka RSA", genre: "Amapiano", art: "/mix/covers/jealousy.jpg" },
    { at: "21:35", title: "Chanel (Extended)", artist: "Blaqbonez ft. Asake", genre: "Afrobeats", year: 2026, art: "/mix/covers/chanel.jpg" },
    { at: "24:04", title: "Comfort", artist: "Mr Eazi ft. MOLIY", genre: "Afrobeats", year: 2026, art: "/mix/covers/comfort.jpg" },
    { at: "26:27", title: "SLICK", artist: "Victony", genre: "Afrobeats", year: 2026, art: "/mix/covers/slick.jpg" },
    { at: "28:03", title: "SLICK (Remix)", artist: "Victony ft. Don Toliver & Summer Walker", genre: "Afrobeats", year: 2026, art: "/mix/covers/slick-remix.jpg" },
    { at: "29:39", title: "STARLIFE", artist: "Victony ft. Blaqbonez & YKB", album: "STARLIFE", genre: "Afrobeats", year: 2026, art: "/mix/covers/starlife.jpg" },
    { at: "32:00", title: "Coachella", artist: "NO11 & Gabzy", genre: "Afrobeats", art: "/mix/covers/coachella.jpg" },
  ],
  moreToday: [
    { title: "Change the Game", artist: "JAY-Z ft. Beanie Sigel & Memphis Bleek", album: "The Dynasty: Roc La Familia", genre: "Hip-Hop/Rap", year: 2000 },
    { title: "Memories", artist: "beabadoobee" },
    { title: "SLICK (Remix)", artist: "Victony ft. Don Toliver & Summer Walker", genre: "Afrobeats", year: 2026, art: "/mix/covers/slick-remix.jpg" },
    { title: "STARLIFE", artist: "Victony ft. Blaqbonez & YKB", album: "STARLIFE", genre: "Afrobeats", year: 2026, art: "/mix/covers/starlife.jpg" },
  ],
  artist: {
    name: "Beark",
    photo: "/mix/works/artist.jpg",
    bio: "Producer and artist. Unreleased music lives here first.",
  },
  works: [
    {
      id: "10",
      kind: "Album",
      title: "10",
      artist: "Beark",
      year: 2026,
      released: "2026-10-10",
      art: "/mix/works/10.jpg",
      preview: "/mix/works/10-preview.mp3",
      tracks: [
        { title: "Track 1" }, { title: "Track 2" }, { title: "Track 3" }, { title: "Track 4" },
        { title: "Track 5" }, { title: "Track 6" }, { title: "Track 7" }, { title: "Track 8" },
        { title: "Track 9" }, { title: "Track 10" }, { title: "Track 11" }, { title: "Track 12" },
      ],
    },
    {
      id: "3-5",
      kind: "EP",
      title: "3.5",
      artist: "Beark",
      year: 2025,
      released: "2025-12-08",
      art: "/mix/works/3-5.jpg",
      songCount: "3.5 songs",
      tracks: [{ title: "Track 1" }, { title: "Track 2" }, { title: "Track 3" }, { title: "Track 4" }],
    },
  ],
  // SHA-256 of the password (default password: beark10). See the steps to change it.
  unlockHash: "fb59348b7545e8b9e520990878a253a240eff2c0e78a616a4a536decb50faca9",
};
