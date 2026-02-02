const STORAGE_KEYS = {
  library: 'pandore_fake_library',
  playlists: 'pandore_fake_playlists',
  artistTracks: 'pandore_fake_artist_tracks'
};

const DEMO_AUDIO_URLS = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
];

const GENRES = [
  'Electronic', 'Hip-Hop', 'Lo-Fi', 'House', 'Ambient', 'Indie',
  'Synthwave', 'Pop', 'Rock', 'R&B', 'Jazz', 'Funk', 'Soul'
];

const ARTIST_NAMES = [
  'Nova Echo', 'Moonlight Circuit', 'Glass Garden', 'Electric Dune',
  'Blue Mirage', 'Velvet Atlas', 'Echo Avenue', 'Aurora Field',
  'Neon Harbor', 'Crystal Static', 'Lunar Drift', 'Golden Index',
  'Violet Pulse', 'Solar Swing', 'Midnight Bloom', 'Astra Vale',
  'Carbon Coast', 'Silver Tide', 'Horizon Bloom', 'Pixel Rain',
  'Dream Static', 'Cobalt Sky', 'Opal Drive', 'Night Palette',
  'Atlas Wave', 'Sierra Glow', 'Future Moss', 'Delta Cassette'
];

const ALBUM_WORDS = [
  'Refractions', 'Pulse', 'Tides', 'Fragments', 'Afterglow',
  'Blueprints', 'Drift', 'Momentum', 'Orbit', 'Mirage'
];

const TRACK_WORDS = [
  'Echoes', 'Bloom', 'Signal', 'Velocity', 'Chroma', 'Lullaby',
  'Cascade', 'Gravity', 'Sparks', 'Frequency', 'Nebula', 'Solstice',
  'Arcade', 'Horizon', 'Parallax', 'Radiant'
];

const BIO_SNIPPETS = [
  'Artiste indépendant qui explore les frontières entre analogique et numérique.',
  'Connu pour ses textures cinématiques et ses rythmes organiques.',
  'Un voyage sonore entre synthés lumineux et grooves profonds.',
  'Des compositions introspectives inspirées par la ville et la nature.',
  'Une énergie live qui mélange mélodies lumineuses et basses puissantes.'
];

const mulberry32 = (seed) => () => {
  let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const getCoverUrl = (seed, size = 600) =>
  `https://picsum.photos/seed/pandore-${seed}/${size}/${size}`;

const getArtistPicture = (seed) =>
  `https://picsum.photos/seed/pandore-artist-${seed}/400/400`;

const pick = (rng, list) => list[Math.floor(rng() * list.length)];

const buildFakeData = () => {
  const rng = mulberry32(42);
  const artists = [];
  const albums = [];
  const tracks = [];

  const artistCount = 25;
  const albumsPerArtist = 2;
  const tracksPerAlbum = 4;

  for (let a = 0; a < artistCount; a += 1) {
    const artistName = ARTIST_NAMES[a % ARTIST_NAMES.length];
    const artistId = `artist_${a}`;
    const artist = {
      user_id: artistId,
      artist_id: artistId,
      name: artistName,
      artist_name: artistName,
      role: 'artist',
      picture: getArtistPicture(a + 1),
      bio: pick(rng, BIO_SNIPPETS)
    };
    artists.push(artist);

    for (let al = 0; al < albumsPerArtist; al += 1) {
      const albumId = `album_${a}_${al}`;
      const trackIds = [];

      for (let t = 0; t < tracksPerAlbum; t += 1) {
        const trackId = `track_${a}_${al}_${t}`;
        const priceCents = Math.round((1 + rng() * 2.5) * 100);
        const duration = Math.floor(140 + rng() * 160);
        const previewStart = Math.min(30, Math.floor(duration * 0.2));
        const isPublished = rng() > 0.15;

        const track = {
          track_id: trackId,
          title: `${pick(rng, TRACK_WORDS)} ${t + 1}`,
          artist_id: artistId,
          artist_name: artistName,
          album_id: albumId,
          genre: pick(rng, GENRES),
          price: priceCents,
          duration,
          preview_start_time: previewStart,
          description: 'Une composition immersive pour vos plus belles écoutes.',
          cover_url: getCoverUrl(`${trackId}-${a}-${t}`, 600),
          preview_url: DEMO_AUDIO_URLS[(a + t) % DEMO_AUDIO_URLS.length],
          file_url: DEMO_AUDIO_URLS[(a + t) % DEMO_AUDIO_URLS.length],
          status: isPublished ? 'published' : 'draft',
          likes_count: Math.floor(rng() * 5000),
          play_count: Math.floor(rng() * 12000),
          sales_count: Math.floor(rng() * 500),
          revenue: Math.floor(rng() * 80000),
          mastering: rng() > 0.6 ? {
            engineer: 'Studio Orion',
            details: 'Mastering analogique & numérique',
            studio: 'Orion Labs'
          } : null,
          splits: rng() > 0.7 ? [
            { party: artistName, percent: 70, role: 'Artiste' },
            { party: 'Pandore', percent: 30, role: 'Plateforme' }
          ] : []
        };

        tracks.push(track);
        trackIds.push(trackId);
      }

      const albumPrice = trackIds
        .map((id) => tracks.find((track) => track.track_id === id)?.price || 0)
        .reduce((sum, value) => sum + value, 0);

      albums.push({
        album_id: albumId,
        title: `${pick(rng, ALBUM_WORDS)} ${al + 1}`,
        artist_id: artistId,
        artist_name: artistName,
        cover_url: getCoverUrl(`${albumId}-${a}-${al}`, 700),
        description: 'Un voyage sonore construit autour de textures lumineuses.',
        track_ids: trackIds,
        price: Math.floor(albumPrice * 0.85),
        release_date: `202${Math.floor(rng() * 4)}-0${1 + (al % 9)}-15`
      });
    }
  }

  return { artists, albums, tracks };
};

const DATA = buildFakeData();

const hasStorage = typeof window !== 'undefined' && window.localStorage;

const loadFromStorage = (key, fallback) => {
  if (!hasStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
};

const saveToStorage = (key, value) => {
  if (!hasStorage) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const seedLibrary = () => ({
  trackIds: DATA.tracks.slice(0, 24).map((track) => track.track_id),
  albumIds: DATA.albums.slice(0, 8).map((album) => album.album_id)
});

const seedPlaylists = () => ([
  {
    playlist_id: 'playlist_1',
    name: 'Chill Vibes',
    description: 'Ambiances douces pour travailler ou se détendre.',
    visibility: 'public',
    track_ids: DATA.tracks.slice(0, 12).map((track) => track.track_id)
  },
  {
    playlist_id: 'playlist_2',
    name: 'Night Drive',
    description: 'Synthés nocturnes et beats hypnotiques.',
    visibility: 'private',
    track_ids: DATA.tracks.slice(20, 32).map((track) => track.track_id)
  }
]);

export const getTracks = () => DATA.tracks;
export const getAlbums = () => DATA.albums;
export const getArtists = () => DATA.artists;

export const getTrackById = (trackId) =>
  DATA.tracks.find((track) => track.track_id === trackId);

export const getAlbumById = (albumId) =>
  DATA.albums.find((album) => album.album_id === albumId);

export const getTracksByIds = (ids) =>
  ids.map((id) => getTrackById(id)).filter(Boolean);

export const getArtistById = (artistId) => {
  const artist = DATA.artists.find((item) => item.user_id === artistId || item.artist_id === artistId);
  if (!artist) return null;
  const tracks = getArtistTracks(artistId);
  const albums = DATA.albums.filter((album) => album.artist_id === artistId);
  return { ...artist, tracks, albums };
};

export const getLibrary = () => {
  const stored = loadFromStorage(STORAGE_KEYS.library, null) || seedLibrary();
  saveToStorage(STORAGE_KEYS.library, stored);
  return {
    tracks: stored.trackIds.map((id) => getTrackById(id)).filter(Boolean),
    albums: stored.albumIds.map((id) => getAlbumById(id)).filter(Boolean)
  };
};

export const addToLibrary = (itemType, itemId) => {
  const stored = loadFromStorage(STORAGE_KEYS.library, null) || seedLibrary();
  if (itemType === 'track') {
    if (!stored.trackIds.includes(itemId)) stored.trackIds.unshift(itemId);
  }
  if (itemType === 'album') {
    if (!stored.albumIds.includes(itemId)) stored.albumIds.unshift(itemId);
    const album = getAlbumById(itemId);
    if (album?.track_ids) {
      album.track_ids.forEach((trackId) => {
        if (!stored.trackIds.includes(trackId)) stored.trackIds.unshift(trackId);
      });
    }
  }
  saveToStorage(STORAGE_KEYS.library, stored);
  return getLibrary();
};

export const getPlaylists = () => {
  const stored = loadFromStorage(STORAGE_KEYS.playlists, null) || seedPlaylists();
  saveToStorage(STORAGE_KEYS.playlists, stored);
  return stored;
};

export const createPlaylist = (playlist) => {
  const stored = getPlaylists();
  const newPlaylist = {
    playlist_id: `playlist_${Date.now()}`,
    visibility: 'private',
    track_ids: [],
    ...playlist
  };
  const updated = [newPlaylist, ...stored];
  saveToStorage(STORAGE_KEYS.playlists, updated);
  return updated;
};

export const deletePlaylist = (playlistId) => {
  const stored = getPlaylists();
  const updated = stored.filter((item) => item.playlist_id !== playlistId);
  saveToStorage(STORAGE_KEYS.playlists, updated);
  return updated;
};

export const getArtistTracks = (artistId) => {
  const stored = loadFromStorage(STORAGE_KEYS.artistTracks, {});
  if (stored[artistId]) return stored[artistId];
  const seeded = DATA.tracks.filter((track) => track.artist_id === artistId);
  stored[artistId] = seeded;
  saveToStorage(STORAGE_KEYS.artistTracks, stored);
  return seeded;
};

export const saveArtistTracks = (artistId, tracks) => {
  const stored = loadFromStorage(STORAGE_KEYS.artistTracks, {});
  stored[artistId] = tracks;
  saveToStorage(STORAGE_KEYS.artistTracks, stored);
};

export const getArtistStats = (tracks) => {
  const totalSales = tracks.reduce((sum, track) => sum + (track.sales_count || 0), 0);
  const totalRevenue = tracks.reduce((sum, track) => sum + (track.revenue || 0), 0);
  const totalPlays = tracks.reduce((sum, track) => sum + (track.play_count || 0), 0);

  return {
    overview: {
      total_tracks: tracks.length,
      published_tracks: tracks.filter((track) => track.status === 'published').length,
      draft_tracks: tracks.filter((track) => track.status !== 'published').length,
      total_sales: totalSales,
      total_revenue: totalRevenue,
      total_play_count: totalPlays,
      total_play_duration_hours: Math.floor(totalPlays * 3 / 60)
    },
    top_tracks: [...tracks]
      .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
      .slice(0, 5),
    track_stats: tracks,
    period_stats: {
      last_7_days: { sales: Math.floor(totalSales * 0.1), revenue: Math.floor(totalRevenue * 0.1) },
      last_30_days: { sales: Math.floor(totalSales * 0.3), revenue: Math.floor(totalRevenue * 0.3) }
    }
  };
};

export const getDemoAudioUrl = (index = 0) =>
  DEMO_AUDIO_URLS[index % DEMO_AUDIO_URLS.length];
