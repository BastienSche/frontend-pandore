import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Music,
  Disc,
  Loader2,
  Shuffle,
  ListOrdered,
  Library as LibraryIcon,
  Sparkles
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { apiClient, formatApiError, resolveApiUrl } from '@/lib/apiClient';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import LibraryTrackRow from '@/components/library/LibraryTrackRow';
import LibraryAlbumCard from '@/components/library/LibraryAlbumCard';
import { shuffleTracks } from '@/lib/libraryCollection';

const normalizeOwnedTrack = (t) => {
  const previewUrl = resolveApiUrl(t.preview_url);
  const fileUrl = resolveApiUrl(t.file_url) || previewUrl;
  return {
    ...t,
    file_url: fileUrl,
    preview_url: previewUrl,
    cover_url: resolveApiUrl(t.cover_url)
  };
};

const Library = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const processedStripeSessions = useRef(new Set());
  const [library, setLibrary] = useState({ tracks: [], albums: [] });
  const [loading, setLoading] = useState(true);
  const [playingAlbumId, setPlayingAlbumId] = useState(null);
  const { currentTrack, isPlaying, playTrack, setQueue } = useAudioPlayer();

  const loadLibrary = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/purchases/library');
      const tracks = (data?.tracks || []).map(normalizeOwnedTrack);
      const albums = (data?.albums || []).map((a) => ({
        ...a,
        cover_url: resolveApiUrl(a.cover_url)
      }));
      setLibrary({ tracks, albums });
    } catch {
      toast.error('Erreur lors du chargement de la bibliothèque');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  /** Après Stripe Checkout : /library?session_id=… — confirme l’achat puis nettoie l’URL (chaque session une fois). */
  useEffect(() => {
    const sid = searchParams.get('session_id');
    if (!sid) return;
    if (processedStripeSessions.current.has(sid)) return;
    processedStripeSessions.current.add(sid);
    (async () => {
      try {
        await apiClient.get(`/api/purchases/status/${encodeURIComponent(sid)}`);
        toast.success('Paiement confirmé — ta bibliothèque est à jour.');
        await loadLibrary();
      } catch (e) {
        processedStripeSessions.current.delete(sid);
        toast.error(formatApiError(e) || "Impossible de confirmer le paiement");
      } finally {
        navigate('/library', { replace: true });
      }
    })();
  }, [searchParams, loadLibrary, navigate]);

  const playableTracks = useMemo(
    () => library.tracks.filter((t) => Boolean(t.file_url)),
    [library.tracks]
  );

  const handleDownload = (track) => {
    if (!track.file_url) {
      toast.error('Fichier indisponible');
      return;
    }
    try {
      const link = document.createElement('a');
      link.href = track.file_url;
      const safe = (track.title || 'track').replace(/[/\\?%*:|"<>]/g, '-');
      link.setAttribute('download', `${safe}.mp3`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Téléchargement commencé');
    } catch {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const playTrackOwned = (track) => {
    if (!track.file_url) {
      toast.error('Fichier complet indisponible pour ce titre');
      return;
    }
    playTrack(track, { mode: 'library' });
  };

  const playAllInOrder = () => {
    if (!playableTracks.length) {
      toast.error('Aucun fichier à lire');
      return;
    }
    setQueue(playableTracks, 0, { mode: 'library' });
  };

  const playShuffle = () => {
    if (!playableTracks.length) {
      toast.error('Aucun fichier à lire');
      return;
    }
    setQueue(shuffleTracks(playableTracks), 0, { mode: 'library' });
  };

  const playAlbumFromLibrary = async (album) => {
    setPlayingAlbumId(album.album_id);
    try {
      const { data } = await apiClient.get(`/api/albums/${album.album_id}`);
      const trackIds = data?.track_ids || [];
      if (!trackIds.length) {
        toast.error('Cet album ne contient aucun titre');
        return;
      }
      const trackResults = await Promise.all(
        trackIds.map((id) => apiClient.get(`/api/tracks/${id}`).then((r) => r.data).catch(() => null))
      );
      const tracks = trackResults
        .filter(Boolean)
        .map(normalizeOwnedTrack)
        .filter((t) => t.file_url);
      if (!tracks.length) {
        toast.error('Aucun fichier audio disponible pour cet album');
        return;
      }
      setQueue(tracks, 0, { mode: 'library' });
    } catch {
      toast.error('Impossible de charger les titres de l’album');
    } finally {
      setPlayingAlbumId(null);
    }
  };

  const totalOwned = library.tracks.length + library.albums.length;

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden">
      <BubbleBackground />
      <GlowOrb color="purple" size={500} x="10%" y="20%" blur={150} />
      <GlowOrb color="cyan" size={400} x="90%" y="70%" blur={120} />

      <div className="relative pt-28 pb-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8"
          >
            <div>
              <div
                className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-gradient-to-r from-purple-500/15 to-pink-500/15 px-3 py-1.5 backdrop-blur-sm"
                data-testid="library-collection-badge"
              >
                <LibraryIcon className="h-3.5 w-3.5 shrink-0 text-purple-300" />
                <span className="text-sm font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Ma collection
                </span>
              </div>
              <h1
                className="text-4xl md:text-6xl font-bold tracking-tighter"
                data-testid="dashboard-title"
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Bibliothèque
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mt-2 max-w-xl">
                Titres et albums que tu as acquis. Lecture du fichier complet, téléchargements et file d’attente
                dédiée à ta collection.
              </p>
            </div>

            {!loading && playableTracks.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 shrink-0" data-testid="library-collection-actions">
                <Button
                  size="lg"
                  className="rounded-full gap-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 border-0 shadow-lg shadow-cyan-500/20"
                  onClick={playShuffle}
                  data-testid="library-play-shuffle"
                >
                  <Shuffle className="w-5 h-5" />
                  Lecture aléatoire
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full gap-2 border border-white/10 bg-white/5 hover:bg-white/10"
                  onClick={playAllInOrder}
                  data-testid="library-play-order"
                >
                  <ListOrdered className="w-5 h-5" />
                  À la suite
                </Button>
              </div>
            )}
          </motion.div>

          {!loading && totalOwned > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 border border-white/10">
                <Music className="w-4 h-4 text-cyan-400" />
                {library.tracks.length} titre{library.tracks.length !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 border border-white/10">
                <Disc className="w-4 h-4 text-purple-400" />
                {library.albums.length} album{library.albums.length !== 1 ? 's' : ''}
              </span>
              {playableTracks.length < library.tracks.length && (
                <span className="inline-flex items-center gap-2 text-amber-400/90">
                  <Sparkles className="w-4 h-4" />
                  {library.tracks.length - playableTracks.length} titre(s) sans source audio disponible
                </span>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Chargement de ta collection…</p>
          </div>
        ) : library.tracks.length === 0 && library.albums.length === 0 ? (
          <div className="text-center py-24" data-testid="empty-library">
            <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Ta bibliothèque est vide</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Achète ou ajoute des titres gratuits depuis le catalogue pour les retrouver ici, avec
              téléchargement et lecture du fichier complet.
            </p>
            <Button
              onClick={() => {
                window.location.href = '/browse';
              }}
              className="rounded-full"
              data-testid="browse-from-empty"
            >
              Découvrir la musique
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="tracks" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="tracks" className="gap-2" data-testid="library-tracks-tab">
                <Music className="w-4 h-4" />
                Titres ({library.tracks.length})
              </TabsTrigger>
              <TabsTrigger value="albums" className="gap-2" data-testid="library-albums-tab">
                <Disc className="w-4 h-4" />
                Albums ({library.albums.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tracks" data-testid="library-tracks-grid" className="space-y-3">
              {library.tracks.map((track, i) => (
                <LibraryTrackRow
                  key={track.track_id}
                  track={track}
                  index={i}
                  isCurrent={currentTrack?.track_id === track.track_id}
                  isPlaying={isPlaying}
                  onPlay={() => playTrackOwned(track)}
                  onDownload={() => handleDownload(track)}
                />
              ))}
            </TabsContent>

            <TabsContent value="albums" data-testid="library-albums-grid">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {library.albums.map((album) => (
                  <LibraryAlbumCard
                    key={album.album_id}
                    album={album}
                    playingAlbumId={playingAlbumId}
                    onPlayAlbum={playAlbumFromLibrary}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Library;
