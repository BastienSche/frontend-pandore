import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Disc, Music, User, Sparkles, HeartHandshake } from 'lucide-react';
import TrackCard from '@/components/TrackCard';
import AlbumCard from '@/components/AlbumCard';
import CoverImage from '@/components/CoverImage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { apiClient, formatApiError, resolveApiUrl, normalizeApiList } from '@/lib/apiClient';
import { artistAvatarSrc } from '@/lib/artistAvatar';
import { getLibraryOwnership } from '@/lib/libraryOwnership';
import { useAuth } from '@/hooks/useAuth';
import { formatItemPriceLabel } from '@/lib/pricing';
import {
  filterCatalogItems,
  isOwnedAlbum,
  isOwnedTrack,
  isPayWhatYouWant,
  sortCatalogItems
} from '@/lib/catalogBrowse';
import { useListScrollRestoration } from '@/hooks/useListScrollRestoration';
import { rememberListPosition } from '@/lib/listNavigation';

const BROWSE_SEARCH_KEY = 'kloud:browseSearch';
const BROWSE_TAB_KEY = 'kloud:browseTabV2';
const BROWSE_UI_KEY = 'kloud:browseDiscover';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};

const TABS = [
  { id: 'mix', label: 'Tout' },
  { id: 'tracks', label: 'Titres' },
  { id: 'albums', label: 'Albums' },
  { id: 'artists', label: 'Artistes' }
];

const isListedCatalogItem = (item) => {
  const status = String(item?.status || 'published').toLowerCase();
  return status !== 'draft';
};

const mapTrack = (t) => ({
  ...t,
  preview_url: resolveApiUrl(t?.preview_url || t?.file_url),
  file_url: null,
  cover_url: resolveApiUrl(t?.cover_url)
});

const mapAlbum = (a) => ({
  ...a,
  cover_url: resolveApiUrl(a?.cover_url)
});

const mapArtist = (a) => ({
  ...a,
  picture: artistAvatarSrc(a)
});

const readStoredTab = () => {
  try {
    const tab = sessionStorage.getItem(BROWSE_TAB_KEY);
    if (tab === 'mix' || tab === 'tracks' || tab === 'albums' || tab === 'artists') return tab;
  } catch {
    // ignore
  }
  return 'mix';
};

const readStoredUi = () => {
  try {
    const raw = sessionStorage.getItem(BROWSE_UI_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    return {
      newest: saved.newest !== false,
      pwyw: Boolean(saved.pwyw)
    };
  } catch {
    return { newest: true, pwyw: false };
  }
};

const chipClass = (active) =>
  `h-9 rounded-full px-4 text-sm inline-flex items-center gap-1.5 border transition-colors whitespace-nowrap ${
    active
      ? 'bg-gradient-to-r from-cyan-500/25 to-purple-500/25 border-cyan-400/40 text-foreground'
      : 'bg-white/5 border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground'
  }`;

const tabClass = (active) =>
  `h-9 rounded-full px-4 text-sm font-medium transition-colors ${
    active ? 'bg-white/15 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
  }`;

const SectionHead = ({ title, hint, onMore }) => (
  <div className="flex items-end justify-between gap-3 mb-3">
    <div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {hint ? <p className="text-xs text-muted-foreground mt-0.5">{hint}</p> : null}
    </div>
    {onMore ? (
      <button
        type="button"
        onClick={onMore}
        className="text-xs text-muted-foreground hover:text-cyan-300 transition-colors"
      >
        Voir tout
      </button>
    ) : null}
  </div>
);

const EmptyState = ({ icon: Icon, title, hint }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center py-16 glass-heavy rounded-3xl"
  >
    <Icon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
    <p className="text-base text-muted-foreground">{title}</p>
    {hint ? <p className="text-sm text-muted-foreground/60 mt-1">{hint}</p> : null}
  </motion.div>
);

const ArtistChip = ({ artist, large = false }) => (
  <Link
    to={`/artist/${artist.user_id}`}
    data-testid={`artist-card-${artist.user_id}`}
    onClick={() => rememberListPosition({ selector: `[data-testid="artist-card-${artist.user_id}"]` })}
    className="group flex flex-col items-center text-center min-w-0"
  >
    <Avatar
      className={`${
        large ? 'w-28 h-28 md:w-32 md:h-32' : 'w-24 h-24 md:w-28 md:h-28'
      } border-2 border-white/10 group-hover:border-cyan-400/60 transition-all duration-300 shadow-[0_8px_28px_rgba(0,0,0,0.35)] group-hover:scale-[1.04]`}
    >
      <AvatarImage src={artist.picture} className="object-cover" />
      <AvatarFallback className="text-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
        {artist.artist_name?.[0] || artist.name?.[0] || '?'}
      </AvatarFallback>
    </Avatar>
    <h3 className="mt-3 text-sm md:text-base font-medium truncate w-full group-hover:text-cyan-400 transition-colors">
      {artist.artist_name || artist.name}
    </h3>
  </Link>
);

const SpotlightTrack = ({ track, owned }) => {
  const navigate = useNavigate();
  const open = () => {
    rememberListPosition({ selector: '[data-testid="browse-spotlight"]' });
    navigate(`/track/${track.track_id}`);
  };

  return (
    <button
      type="button"
      onClick={open}
      data-testid="browse-spotlight"
      className="relative w-full h-full min-h-[240px] overflow-hidden rounded-[1.75rem] text-left group"
    >
      <CoverImage
        src={track.cover_url}
        alt={track.title}
        className="absolute inset-0"
        imgClassName="transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/80 text-white">
          À la une
        </span>
        {owned ? (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/80 text-white">
            Acquis
          </span>
        ) : null}
      </div>
      <div className="absolute bottom-0 inset-x-0 p-5 md:p-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/90 mb-1">Sortie</p>
        <h2 className="text-2xl md:text-3xl font-bold leading-tight line-clamp-2">{track.title}</h2>
        <p className="mt-1 text-sm text-white/75 truncate">{track.artist_name}</p>
        <p className="mt-2 text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">
          {formatItemPriceLabel(track)}
        </p>
      </div>
    </button>
  );
};

const SpotlightAlbum = ({ album, owned }) => (
  <Link
    to={`/album/${album.album_id}`}
    onClick={() => rememberListPosition({ selector: `[data-testid="browse-spotlight-album"]` })}
    data-testid="browse-spotlight-album"
    className="flex min-h-[118px] overflow-hidden rounded-2xl glass-heavy group"
  >
    <CoverImage src={album.cover_url} alt={album.title} className="w-[118px] shrink-0 h-full" />
    <div className="flex-1 min-w-0 p-3.5 flex flex-col justify-center">
      <p className="text-[10px] uppercase tracking-widest text-purple-300 mb-1">Album</p>
      <h3 className="font-semibold truncate group-hover:text-purple-300 transition-colors">{album.title}</h3>
      <p className="text-xs text-muted-foreground truncate">{album.artist_name}</p>
      <p className="mt-1.5 text-xs font-semibold text-purple-300">
        {owned ? 'Acquis' : formatItemPriceLabel(album)}
      </p>
    </div>
  </Link>
);

const SpotlightArtist = ({ artist }) => (
  <Link
    to={`/artist/${artist.user_id}`}
    onClick={() => rememberListPosition({ selector: `[data-testid="browse-spotlight-artist-${artist.user_id}"]` })}
    data-testid={`browse-spotlight-artist-${artist.user_id}`}
    className="flex items-center gap-3 rounded-2xl glass-heavy p-3 group min-w-0 h-full"
  >
    <Avatar className="w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] shrink-0 border-2 border-white/10">
      <AvatarImage src={artist.picture} className="object-cover" />
      <AvatarFallback>{artist.artist_name?.[0] || artist.name?.[0] || '?'}</AvatarFallback>
    </Avatar>
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-widest text-emerald-300">Artiste</p>
      <p className="font-medium truncate group-hover:text-cyan-300 transition-colors">
        {artist.artist_name || artist.name}
      </p>
    </div>
  </Link>
);

const Browse = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [catalog, setCatalog] = useState({ tracks: [], albums: [], artists: [] });
  const [searchQuery, setSearchQuery] = useState(() => {
    try {
      return sessionStorage.getItem(BROWSE_SEARCH_KEY) || '';
    } catch {
      return '';
    }
  });
  const [browseTab, setBrowseTab] = useState(readStoredTab);
  const [ui, setUi] = useState(readStoredUi);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [ownership, setOwnership] = useState({ trackIds: new Set(), albumIds: new Set() });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [tracksResp, albumsResp, artistsResp] = await Promise.all([
          apiClient.get('/api/tracks', { params: { limit: 200 } }),
          apiClient.get('/api/albums', { params: { limit: 200 } }),
          apiClient.get('/api/artists', { params: { limit: 100 } })
        ]);
        if (cancelled) return;
        setCatalog({
          tracks: normalizeApiList(tracksResp.data).map(mapTrack),
          albums: normalizeApiList(albumsResp.data).filter(isListedCatalogItem).map(mapAlbum),
          artists: normalizeApiList(artistsResp.data).map(mapArtist)
        });
      } catch (error) {
        if (!cancelled) toast.error(formatApiError(error, 'Erreur lors du chargement'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      setOwnership({ trackIds: new Set(), albumIds: new Set() });
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const next = await getLibraryOwnership(apiClient);
        if (!cancelled) setOwnership(next);
      } catch {
        if (!cancelled) setOwnership({ trackIds: new Set(), albumIds: new Set() });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      setSearching(false);
      return undefined;
    }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await apiClient.get('/api/search', {
          params: { q, types: 'tracks,albums,artists', limit: 40 }
        });
        if (cancelled) return;
        setSearchResults({
          tracks: normalizeApiList(data?.tracks).map(mapTrack),
          albums: normalizeApiList(data?.albums).filter(isListedCatalogItem).map(mapAlbum),
          artists: normalizeApiList(data?.artists).map(mapArtist)
        });
      } catch (error) {
        if (!cancelled) {
          setSearchResults({ tracks: [], albums: [], artists: [] });
          toast.error(formatApiError(error, 'Recherche impossible'));
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const sourceTracks = searchResults ? searchResults.tracks : catalog.tracks;
  const sourceAlbums = searchResults ? searchResults.albums : catalog.albums;
  const sourceArtists = searchResults ? searchResults.artists : catalog.artists;
  const busy = loading || (Boolean(searchQuery.trim()) && searching && !searchResults);
  const tracks = useMemo(() => {
    const sortId = ui.newest ? 'newest' : 'popular';
    return sortCatalogItems(
      filterCatalogItems(sourceTracks, {
        ownedMode: isAuthenticated ? 'discover' : 'all',
        recency: 'all',
        genre: '',
        hideAlbumTracks: false,
        ownership,
        payWhatYouWant: ui.pwyw,
        kind: 'track'
      }),
      sortId
    );
  }, [sourceTracks, ownership, isAuthenticated, ui.newest, ui.pwyw]);

  const albums = useMemo(() => {
    const sortId = ui.newest ? 'newest' : 'popular';
    return sortCatalogItems(
      filterCatalogItems(sourceAlbums, {
        ownedMode: isAuthenticated ? 'discover' : 'all',
        recency: 'all',
        genre: '',
        hideAlbumTracks: false,
        ownership,
        payWhatYouWant: ui.pwyw,
        kind: 'album'
      }),
      sortId
    );
  }, [sourceAlbums, ownership, isAuthenticated, ui.newest, ui.pwyw]);

  const artists = useMemo(() => {
    const recencyFiltered = filterCatalogItems(sourceArtists, {
      ownedMode: 'all',
      recency: 'all',
      genre: '',
      hideAlbumTracks: false,
      ownership,
      kind: 'artist',
      payWhatYouWant: false
    });
    return sortCatalogItems(
      recencyFiltered.map((a) => ({ ...a, title: a.artist_name || a.name })),
      ui.newest ? 'newest' : 'title'
    );
  }, [sourceArtists, ownership, ui.newest]);

  const pwywTracks = useMemo(
    () => tracks.filter(isPayWhatYouWant).slice(0, 5),
    [tracks]
  );

  const mix = useMemo(() => {
    const spotlightTrack = tracks[0] || null;
    const usedTrackIds = new Set(spotlightTrack ? [spotlightTrack.track_id] : []);
    const spotlightAlbum = albums[0] || null;
    const spotlightArtists = spotlightAlbum ? artists.slice(0, 2) : [];
    const moreTracks = tracks.filter((t) => !usedTrackIds.has(t.track_id)).slice(0, 5);
    const moreAlbums = albums.filter((a) => a.album_id !== spotlightAlbum?.album_id).slice(0, 4);
    const moreArtists = artists
      .filter((a) => !spotlightArtists.some((s) => s.user_id === a.user_id))
      .slice(0, 8);
    const extraPwyw = ui.pwyw
      ? []
      : pwywTracks.filter((t) => t.track_id !== spotlightTrack?.track_id).slice(0, 4);
    return {
      spotlightTrack,
      spotlightAlbum,
      spotlightArtists,
      moreTracks,
      moreAlbums,
      moreArtists,
      extraPwyw
    };
  }, [tracks, albums, artists, pwywTracks, ui.pwyw]);

  useEffect(() => {
    try {
      sessionStorage.setItem(BROWSE_SEARCH_KEY, searchQuery);
    } catch {
      // ignore
    }
  }, [searchQuery]);

  useEffect(() => {
    try {
      sessionStorage.setItem(BROWSE_TAB_KEY, browseTab);
    } catch {
      // ignore
    }
  }, [browseTab]);

  useEffect(() => {
    try {
      sessionStorage.setItem(BROWSE_UI_KEY, JSON.stringify(ui));
    } catch {
      // ignore
    }
  }, [ui]);

  useListScrollRestoration(!busy);

  const searchingHint = searchQuery.trim()
    ? `Résultats pour « ${searchQuery.trim()} »`
    : ui.newest
      ? 'Les dernières sorties, mélangées'
      : 'Les plus écoutés du moment';

  const renderTrackGrid = (list, { testId } = {}) => {
    if (busy) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="aspect-square rounded-3xl glass animate-pulse" />
          ))}
        </div>
      );
    }
    if (!list.length) {
      return (
        <EmptyState
          icon={Music}
          title="Aucun titre trouvé"
          hint="Essaie un autre filtre ou une autre recherche."
        />
      );
    }
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
        data-testid={testId}
      >
        {list.map((track) => (
          <motion.div key={track.track_id} variants={itemVariants}>
            <TrackCard track={track} owned={isAuthenticated && isOwnedTrack(track, ownership)} />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const renderAlbumGrid = (list, testId) => {
    if (busy) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square rounded-3xl glass animate-pulse" />
          ))}
        </div>
      );
    }
    if (!list.length) {
      return <EmptyState icon={Disc} title="Aucun album trouvé" hint="Essaie une autre recherche." />;
    }
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        data-testid={testId}
      >
        {list.map((album) => (
          <motion.div key={album.album_id} variants={itemVariants}>
            <AlbumCard album={album} owned={isAuthenticated && isOwnedAlbum(album, ownership)} />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const renderArtistGrid = (list, { compact = false, testId } = {}) => {
    if (busy) {
      return (
        <div className={`grid ${compact ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'} gap-5`}>
          {[...Array(compact ? 6 : 10)].map((_, i) => (
            <div key={i} className="mx-auto w-24 h-24 md:w-28 md:h-28 rounded-full glass animate-pulse" />
          ))}
        </div>
      );
    }
    if (!list.length) {
      return <EmptyState icon={User} title="Aucun artiste trouvé" hint="Essaie une autre recherche." />;
    }
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`grid ${compact ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'} gap-x-4 gap-y-7`}
        data-testid={testId}
      >
        {list.map((artist) => (
          <motion.div key={artist.user_id} variants={itemVariants}>
            <ArtistChip artist={artist} large={!compact} />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const mixIsEmpty = !mix.spotlightTrack && !mix.spotlightAlbum && !artists.length;

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden">
      <BubbleBackground />
      <GlowOrb color="cyan" size={460} x="8%" y="16%" blur={120} />
      <GlowOrb color="purple" size={360} x="92%" y="58%" blur={100} />

      <div className="relative pt-24 pb-6 px-6 md:px-12">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tighter"
              data-testid="browse-title"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Découvrir
              </span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1.5">
              {searchingHint}
            </p>
          </motion.div>

          <div className="relative group mb-5" data-testid="browse-filters">
            <div
              className="pointer-events-none absolute -inset-[1px] rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 opacity-55 blur-[1px] transition-opacity duration-300 group-focus-within:opacity-100"
              aria-hidden
            />
            <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_48px_rgba(34,211,238,0.16)] group-focus-within:shadow-[0_0_64px_rgba(168,85,247,0.28)] transition-shadow" />
            <div className="relative rounded-full bg-[#071018]/80 backdrop-blur-xl border border-white/10">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-300/85 pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher un titre, un album, un artiste…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-16 pl-16 pr-6 bg-transparent rounded-full text-base md:text-lg outline-none placeholder:text-muted-foreground/45"
                data-testid="browse-search-input"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div
              className="flex items-center rounded-full bg-white/5 border border-white/10 p-1 shrink-0 overflow-x-auto"
              data-testid="browse-tabs"
              role="tablist"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={browseTab === tab.id}
                  className={tabClass(browseTab === tab.id)}
                  onClick={() => setBrowseTab(tab.id)}
                  data-testid={
                    tab.id === 'tracks'
                      ? 'tracks-tab'
                      : tab.id === 'albums'
                        ? 'albums-tab'
                        : tab.id === 'artists'
                          ? 'artists-tab'
                          : 'mix-tab'
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className={chipClass(ui.newest)}
                onClick={() => setUi((prev) => ({ ...prev, newest: !prev.newest }))}
                data-testid="browse-filter-newest"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Nouveautés
              </button>
              <button
                type="button"
                className={chipClass(ui.pwyw)}
                onClick={() => setUi((prev) => ({ ...prev, pwyw: !prev.pwyw }))}
                data-testid="browse-filter-pwyw"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                Prix libre
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 space-y-8">
        {browseTab === 'mix' && (
          <>
            {busy ? (
              <div className="grid md:grid-cols-12 gap-4">
                <div className="md:col-span-7 h-[260px] rounded-[1.75rem] glass animate-pulse" />
                <div className="md:col-span-5 space-y-3">
                  <div className="h-[118px] rounded-2xl glass animate-pulse" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-[72px] rounded-2xl glass animate-pulse" />
                    <div className="h-[72px] rounded-2xl glass animate-pulse" />
                  </div>
                </div>
              </div>
            ) : mixIsEmpty ? (
              <EmptyState
                icon={Music}
                title="Rien à afficher pour l’instant"
                hint="Essaie d’enlever un filtre, ou reviens un peu plus tard."
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`grid gap-4 ${mix.spotlightAlbum || mix.spotlightArtists.length ? 'md:grid-cols-12' : ''}`}
              >
                <div className={mix.spotlightAlbum || mix.spotlightArtists.length ? 'md:col-span-7' : ''}>
                  {mix.spotlightTrack ? (
                    <SpotlightTrack
                      track={mix.spotlightTrack}
                      owned={isAuthenticated && isOwnedTrack(mix.spotlightTrack, ownership)}
                    />
                  ) : mix.spotlightAlbum ? (
                    <Link
                      to={`/album/${mix.spotlightAlbum.album_id}`}
                      className="block h-full min-h-[240px] overflow-hidden rounded-[1.75rem]"
                    >
                      <CoverImage
                        src={mix.spotlightAlbum.cover_url}
                        alt={mix.spotlightAlbum.title}
                        className="h-full min-h-[240px]"
                      />
                    </Link>
                  ) : null}
                </div>
                {mix.spotlightAlbum || mix.spotlightArtists.length ? (
                  <div className="md:col-span-5 flex flex-col gap-3">
                    {mix.spotlightAlbum ? (
                      <SpotlightAlbum
                        album={mix.spotlightAlbum}
                        owned={isAuthenticated && isOwnedAlbum(mix.spotlightAlbum, ownership)}
                      />
                    ) : null}
                    {mix.spotlightArtists.length > 0 ? (
                      <div
                        className={`grid gap-3 flex-1 ${
                          mix.spotlightArtists.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                        }`}
                      >
                        {mix.spotlightArtists.map((artist) => (
                          <SpotlightArtist key={artist.user_id} artist={artist} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </motion.div>
            )}

            {mix.moreTracks.length > 0 && (
              <section>
                <SectionHead
                  title="Sorties"
                  hint="Titres à découvrir"
                  onMore={() => setBrowseTab('tracks')}
                />
                {renderTrackGrid(mix.moreTracks, { testId: 'tracks-grid' })}
              </section>
            )}

            {mix.moreAlbums.length > 0 && (
              <section>
                <SectionHead title="Albums" onMore={() => setBrowseTab('albums')} />
                {renderAlbumGrid(mix.moreAlbums, 'albums-grid')}
              </section>
            )}

            {mix.extraPwyw.length > 0 && (
              <section>
                <SectionHead
                  title="Prix libre"
                  hint="Tu choisis ce que tu mets"
                  onMore={() => {
                    setUi((prev) => ({ ...prev, pwyw: true }));
                    setBrowseTab('tracks');
                  }}
                />
                {renderTrackGrid(mix.extraPwyw)}
              </section>
            )}

            {mix.moreArtists.length > 0 && (
              <section>
                <SectionHead title="Artistes" onMore={() => setBrowseTab('artists')} />
                {renderArtistGrid(mix.moreArtists, { compact: true, testId: 'artists-grid' })}
              </section>
            )}
          </>
        )}

        {browseTab === 'tracks' && (
          <section data-testid="tracks-grid">
            {renderTrackGrid(tracks.slice(0, 15))}
          </section>
        )}

        {browseTab === 'albums' && (
          <section data-testid="albums-grid">
            {renderAlbumGrid(albums.slice(0, 12))}
          </section>
        )}

        {browseTab === 'artists' && (
          <section data-testid="artists-grid">
            {renderArtistGrid(artists.slice(0, 18), { compact: false })}
          </section>
        )}
      </div>
    </div>
  );
};

export default Browse;
