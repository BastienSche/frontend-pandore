import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Play,
  Pause,
  Heart,
  Music,
  Loader2,
  Clock,
  User,
  Check,
  Library,
  ArrowLeft,
  Download,
  ListOrdered,
  Shuffle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { apiClient, resolveApiUrl } from '@/lib/apiClient';
import { fetchLikeState, like, unlike } from '@/lib/likes';
import { getLibraryOwnership } from '@/lib/libraryOwnership';
import { formatTrackDuration, shuffleTracks } from '@/lib/libraryCollection';
import { heartIconActiveClass } from '@/lib/heartIconClass';

const LibraryAlbumOwned = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack, setQueue } = useAudioPlayer();
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { albumIds } = await getLibraryOwnership(apiClient);
        if (!albumIds.has(albumId)) {
          toast.error("Cet album n'est pas dans ta collection");
          navigate('/library', { replace: true });
          return;
        }
        const { data } = await apiClient.get(`/api/albums/${albumId}`);
        if (cancelled) return;
        const resolvedAlbum = { ...data, cover_url: resolveApiUrl(data?.cover_url) };
        setAlbum(resolvedAlbum);

        const trackIds = data?.track_ids || [];
        if (!trackIds.length) {
          setTracks([]);
        } else {
          const trackResults = await Promise.all(
            trackIds.map((id) => apiClient.get(`/api/tracks/${id}`).then((r) => r.data).catch(() => null))
          );
          if (cancelled) return;
          setTracks(
            trackResults
              .filter(Boolean)
              .map((t) => {
                const previewUrl = resolveApiUrl(t?.preview_url);
                const fileUrl = resolveApiUrl(t?.file_url) || previewUrl;
                return ({
                ...t,
                preview_url: previewUrl,
                file_url: fileUrl,
                cover_url: resolveApiUrl(t?.cover_url)
              });
              })
          );
        }
      } catch {
        if (!cancelled) {
          toast.error('Impossible de charger l’album');
          navigate('/library', { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [albumId, navigate]);

  useEffect(() => {
    if (!albumId) return;
    let mounted = true;
    (async () => {
      try {
        const state = await fetchLikeState('album', [albumId]);
        if (mounted) setLiked(!!state?.[albumId]);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [albumId]);

  const toggleLike = async () => {
    const next = !liked;
    setLiked(next);
    try {
      if (next) await like('album', albumId);
      else await unlike('album', albumId);
    } catch (e) {
      setLiked(!next);
      toast.error(e.response?.data?.detail || 'Erreur');
    }
  };

  const playableTracks = tracks.filter((t) => t.file_url || t.preview_url);

  const playAlbumOrder = () => {
    if (!playableTracks.length) {
      toast.error('Aucun fichier audio disponible');
      return;
    }
    setQueue(playableTracks, 0, { mode: 'library' });
  };

  const playAlbumShuffle = () => {
    if (!playableTracks.length) {
      toast.error('Aucun fichier audio disponible');
      return;
    }
    setQueue(shuffleTracks(playableTracks), 0, { mode: 'library' });
  };

  const playTrackOwned = (track) => {
    if (!track.file_url && !track.preview_url) {
      toast.error('Fichier indisponible');
      return;
    }
    playTrack(track, { mode: 'library' });
  };

  const handleDownload = (track) => {
    const audioUrl = track.file_url || track.preview_url;
    if (!audioUrl) return;
    try {
      const link = document.createElement('a');
      link.href = audioUrl;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <BubbleBackground />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Loader2 className="w-12 h-12 text-cyan-400" />
        </motion.div>
      </div>
    );
  }

  if (!album) return null;

  const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);
  const firstTrack = tracks?.[0];

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden">
      <BubbleBackground />
      <GlowOrb color="cyan" size={520} x="12%" y="28%" blur={150} />
      <GlowOrb color="purple" size={420} x="88%" y="72%" blur={130} />

      <div className="relative pt-24 pb-10">
        {album.cover_url && (
          <div
            className="absolute inset-0 opacity-25 blur-3xl"
            style={{
              backgroundImage: `radial-gradient(circle at 30% 35%, rgba(34,211,238,0.35), transparent 55%), radial-gradient(circle at 70% 60%, rgba(168,85,247,0.35), transparent 55%), url(${album.cover_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        )}

        <div className="relative max-w-6xl mx-auto px-6 md:px-12">
          <Link
            to="/library"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-300 transition-colors mb-6"
            data-testid="library-album-owned-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la bibliothèque
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-heavy rounded-[2.5rem] border border-white/10 p-6 md:p-8"
          >
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="relative shrink-0"
              >
                {album.cover_url ? (
                  <img
                    src={album.cover_url}
                    alt={album.title}
                    className="w-56 h-56 md:w-72 md:h-72 rounded-3xl shadow-2xl object-cover"
                    data-testid="library-owned-album-cover"
                  />
                ) : (
                  <div className="w-56 h-56 md:w-72 md:h-72 rounded-3xl glass flex items-center justify-center border border-white/10">
                    <Music className="w-20 h-20 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-purple-500/20 blur-2xl -z-10" />
              </motion.div>

              <div className="flex-1 min-w-0 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/25 gap-1">
                    <Library className="w-3.5 h-3.5" />
                    Album · Ma collection
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {tracks.length} titre{tracks.length > 1 ? 's' : ''}
                  </span>
                  {totalDuration > 0 && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {hours > 0 ? `${hours}h ` : ''}
                      {minutes}min
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight" data-testid="library-owned-album-title">
                    {album.title}
                  </h1>
                  <button
                    type="button"
                    className="text-left text-muted-foreground hover:text-cyan-300 transition-colors inline-flex items-center gap-2"
                    onClick={() => navigate(`/artist/${album.artist_id}`)}
                  >
                    <User className="w-4 h-4" />
                    <span className="truncate">{album.artist_name}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="rounded-full px-7 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 border-0 shadow-[0_0_30px_rgba(16,185,129,0.25)]"
                    onClick={() => {
                      if (playableTracks.length) playAlbumOrder();
                      else if (firstTrack?.file_url || firstTrack?.preview_url) playTrackOwned(firstTrack);
                    }}
                    disabled={!playableTracks.length && !firstTrack?.preview_url && !firstTrack?.file_url}
                    data-testid="library-owned-album-play"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Lire l&apos;album
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-7 glass border-white/10 hover:bg-white/10"
                    onClick={playAlbumShuffle}
                    disabled={!playableTracks.length}
                    data-testid="library-owned-album-shuffle"
                  >
                    <Shuffle className="w-5 h-5 mr-2" />
                    Aléatoire
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-7 glass border-white/10 hover:bg-white/10"
                    onClick={toggleLike}
                  >
                    <Heart className={`w-5 h-5 mr-2 ${heartIconActiveClass(liked)}`} />
                    {liked ? 'En favoris' : 'Favoris'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 space-y-6 min-w-0"
          >
            {album.description && (
              <div className="glass-heavy rounded-3xl p-6 space-y-3 min-w-0 max-w-full overflow-hidden">
                <h3 className="font-semibold text-lg">À propos de l’album</h3>
                <p className="text-muted-foreground leading-relaxed break-words [overflow-wrap:anywhere]">
                  {album.description}
                </p>
              </div>
            )}

            <div className="glass-heavy rounded-3xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="font-semibold text-lg">Titres</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full gap-1.5"
                    onClick={playAlbumOrder}
                    disabled={!playableTracks.length}
                  >
                    <ListOrdered className="w-4 h-4" />
                    Ordre
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full gap-1.5"
                    onClick={playAlbumShuffle}
                    disabled={!playableTracks.length}
                  >
                    <Shuffle className="w-4 h-4" />
                    Mélanger
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {tracks.map((track, index) => {
                  const isCurrent = currentTrack?.track_id === track.track_id;
                  const hasAudio = Boolean(track.file_url || track.preview_url);
                  return (
                    <div
                      key={track.track_id}
                      className="flex items-center gap-2 p-2 rounded-2xl bg-white/0 hover:bg-white/5 border border-white/0 hover:border-white/10 transition-colors group"
                    >
                      <button
                        type="button"
                        className="flex flex-1 min-w-0 items-center gap-3 text-left"
                        onClick={() => playTrackOwned(track)}
                        disabled={!hasAudio}
                        data-testid={`library-owned-album-track-${index}`}
                      >
                        <span className="text-sm text-muted-foreground w-7 text-right tabular-nums shrink-0">
                          {index + 1}
                        </span>
                        <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          {isCurrent && isPlaying ? (
                            <Pause className="w-4 h-4 text-emerald-300" />
                          ) : (
                            <Play className="w-4 h-4 text-muted-foreground group-hover:text-emerald-300 transition-colors ml-0.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{track.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {hasAudio ? 'Audio disponible' : 'Fichier indisponible'}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground tabular-nums shrink-0 hidden sm:inline">
                          {formatTrackDuration(track.duration)}
                        </span>
                      </button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="shrink-0 rounded-full h-9 w-9"
                        disabled={!hasAudio}
                        onClick={() => handleDownload(track)}
                        aria-label="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Link
                        to={`/library/tracks/${track.track_id}`}
                        className="text-xs text-cyan-400/90 hover:text-cyan-300 transition-colors px-2 shrink-0 hidden sm:inline"
                      >
                        Fiche
                      </Link>
                    </div>
                  );
                })}

                {(!tracks || tracks.length === 0) && (
                  <div className="text-sm text-muted-foreground">Aucun titre dans cet album.</div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="glass-heavy rounded-3xl p-6 space-y-6 sticky top-24">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Accès</p>
                <p className="text-lg font-semibold text-emerald-300">Album acquis</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Écoute les fichiers complets, sans extrait ni achat.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full h-14 rounded-full bg-white/5 border-white/10 hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-400"
                onClick={toggleLike}
              >
                <Heart className={`w-5 h-5 mr-2 ${heartIconActiveClass(liked)}`} />
                {liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              </Button>

              <div className="space-y-3 pt-4 border-t border-white/10">
                {[
                  `${tracks.length} titre${tracks.length > 1 ? 's' : ''} en lecture complète`,
                  'Téléchargement par titre',
                  'Qualité audio source'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-emerald-400" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LibraryAlbumOwned;
