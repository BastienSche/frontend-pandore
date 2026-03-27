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
  ListPlus,
  Library,
  ArrowLeft,
  Download
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
import { formatTrackDuration } from '@/lib/libraryCollection';
import { heartIconActiveClass } from '@/lib/heartIconClass';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const LibraryTrackOwned = () => {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack } = useAudioPlayer();
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [addingToPlaylist, setAddingToPlaylist] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { trackIds } = await getLibraryOwnership(apiClient);
        if (!trackIds.has(trackId)) {
          toast.error("Ce titre n'est pas dans ta collection");
          navigate('/library', { replace: true });
          return;
        }
        const { data } = await apiClient.get(`/api/tracks/${trackId}`);
        if (cancelled) return;
        const previewUrl = resolveApiUrl(data?.preview_url);
        const fileUrl = resolveApiUrl(data?.file_url) || previewUrl;
        setTrack({
          ...data,
          preview_url: previewUrl,
          file_url: fileUrl,
          cover_url: resolveApiUrl(data?.cover_url)
        });
      } catch {
        if (!cancelled) {
          toast.error('Impossible de charger le titre');
          navigate('/library', { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trackId, navigate]);

  useEffect(() => {
    if (!trackId) return;
    let mounted = true;
    (async () => {
      try {
        const state = await fetchLikeState('track', [trackId]);
        if (mounted) setLiked(!!state?.[trackId]);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [trackId]);

  const toggleLike = async () => {
    const next = !liked;
    setLiked(next);
    try {
      if (next) await like('track', trackId);
      else await unlike('track', trackId);
    } catch (e) {
      setLiked(!next);
      toast.error(e.response?.data?.detail || 'Erreur');
    }
  };

  const loadPlaylists = async () => {
    const { data } = await apiClient.get('/api/playlists');
    setPlaylists(data || []);
    if (!selectedPlaylistId && data?.[0]?.playlist_id) setSelectedPlaylistId(data[0].playlist_id);
  };

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylistId) {
      toast.error('Choisis une playlist');
      return;
    }
    setAddingToPlaylist(true);
    try {
      await apiClient.post(`/api/playlists/${selectedPlaylistId}/tracks`, { track_id: trackId });
      toast.success('Ajouté à la playlist');
      setPlaylistDialogOpen(false);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erreur');
    } finally {
      setAddingToPlaylist(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    try {
      const { data } = await apiClient.post('/api/playlists', {
        name: newPlaylistName.trim(),
        description: newPlaylistDescription || null
      });
      setPlaylists((prev) => [data, ...(prev || [])]);
      setSelectedPlaylistId(data.playlist_id);
      setCreatingPlaylist(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      toast.success('Playlist créée');
    } catch (e2) {
      toast.error(e2.response?.data?.detail || 'Erreur');
    }
  };

  const handleDownload = () => {
    const audioUrl = track?.file_url || track?.preview_url;
    if (!audioUrl) {
      toast.error('Fichier indisponible');
      return;
    }
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

  const playOwned = () => {
    if (!track?.file_url && !track?.preview_url) {
      toast.error('Audio indisponible');
      return;
    }
    playTrack(track, { mode: 'library' });
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

  if (!track) return null;

  const isCurrentTrack = currentTrack?.track_id === track.track_id;
  const hasAudio = Boolean(track.file_url || track.preview_url);

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden">
      <BubbleBackground />
      <GlowOrb color="cyan" size={500} x="10%" y="30%" blur={150} />
      <GlowOrb color="purple" size={400} x="90%" y="70%" blur={120} />

      <div className="relative pt-24 pb-10">
        {track.cover_url && (
          <div
            className="absolute inset-0 opacity-25 blur-3xl"
            style={{
              backgroundImage: `radial-gradient(circle at 30% 35%, rgba(34,211,238,0.35), transparent 55%), radial-gradient(circle at 70% 60%, rgba(168,85,247,0.35), transparent 55%), url(${track.cover_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        )}

        <div className="relative max-w-6xl mx-auto px-6 md:px-12">
          <Link
            to="/library"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-300 transition-colors mb-6"
            data-testid="library-track-owned-back"
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
                {track.cover_url ? (
                  <img
                    src={track.cover_url}
                    alt={track.title}
                    className="w-56 h-56 md:w-72 md:h-72 rounded-3xl shadow-2xl object-cover"
                    data-testid="library-owned-track-cover"
                  />
                ) : (
                  <div className="w-56 h-56 md:w-72 md:h-72 rounded-3xl glass flex items-center justify-center border border-white/10">
                    <Music className="w-20 h-20 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 blur-2xl -z-10" />
              </motion.div>

              <div className="flex-1 min-w-0 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/25 gap-1">
                    <Library className="w-3.5 h-3.5" />
                    Ma collection
                  </Badge>
                  <Badge variant="secondary" className="bg-white/5 border-white/10">
                    {track.genre}
                  </Badge>
                  {track.duration != null && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {formatTrackDuration(track.duration)}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight" data-testid="library-owned-track-title">
                    {track.title}
                  </h1>
                  <button
                    type="button"
                    className="text-left text-muted-foreground hover:text-cyan-300 transition-colors inline-flex items-center gap-2"
                    onClick={() => navigate(`/artist/${track.artist_id}`)}
                  >
                    <User className="w-4 h-4" />
                    <span className="truncate">{track.artist_name}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    disabled={!hasAudio}
                    className="rounded-full px-7 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 border-0 shadow-[0_0_30px_rgba(16,185,129,0.25)]"
                    onClick={playOwned}
                    data-testid="library-owned-track-play"
                  >
                    {isCurrentTrack && isPlaying ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" /> Écouter le titre
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    disabled={!hasAudio}
                    className="rounded-full px-7 glass border-white/10 hover:bg-white/10"
                    onClick={handleDownload}
                    data-testid="library-owned-track-download"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Télécharger
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
            className="lg:col-span-2 space-y-6"
          >
            <div className="glass-heavy rounded-3xl p-6">
              <div className="flex items-center gap-4">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    disabled={!hasAudio}
                    className="rounded-full w-16 h-16 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 border-0 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                    onClick={playOwned}
                    data-testid="library-owned-track-play-inline"
                  >
                    {isCurrentTrack && isPlaying ? (
                      <Pause className="w-7 h-7 text-white" />
                    ) : (
                      <Play className="w-7 h-7 text-white ml-1" />
                    )}
                  </Button>
                </motion.div>
                <div>
                  <p className="font-medium">Fichier audio complet</p>
                  <p className="text-sm text-muted-foreground">
                    {hasAudio
                      ? 'Lecture haute qualité — tu as acquis ce titre.'
                      : 'Aucune source audio disponible pour le moment.'}
                  </p>
                </div>
              </div>
            </div>

            {track.description && (
              <div className="glass-heavy rounded-3xl p-6 space-y-3">
                <h3 className="font-semibold text-lg">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{track.description}</p>
              </div>
            )}

            {track.mastering && (
              <div className="glass-heavy rounded-3xl p-6 space-y-3">
                <h3 className="font-semibold text-lg">Mastering</h3>
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    <span className="text-foreground font-medium">Engineer:</span> {track.mastering.engineer || 'N/A'}
                  </p>
                  {track.mastering.details && (
                    <p className="text-muted-foreground">{track.mastering.details}</p>
                  )}
                </div>
              </div>
            )}

            {track.splits && track.splits.length > 0 && (
              <div className="glass-heavy rounded-3xl p-6 space-y-4">
                <h3 className="font-semibold text-lg">Répartition des revenus</h3>
                <div className="space-y-3">
                  {track.splits.map((split, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                      <span className="text-muted-foreground">{split.party}</span>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        {split.percent}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="glass-heavy rounded-3xl p-6 space-y-6 sticky top-24">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Accès</p>
                <p className="text-lg font-semibold text-emerald-300">Titre acquis</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Pas de preview : tu écoutes le fichier complet et tu peux télécharger.
                </p>
              </div>

              <Button
                className="w-full h-14 rounded-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 border-0 shadow-[0_0_30px_rgba(16,185,129,0.25)]"
                disabled={!hasAudio}
                onClick={handleDownload}
                data-testid="library-owned-track-download-full"
              >
                <Download className="w-5 h-5 mr-2" />
                Télécharger le fichier
              </Button>

              <Dialog
                open={playlistDialogOpen}
                onOpenChange={async (open) => {
                  setPlaylistDialogOpen(open);
                  if (open) {
                    try {
                      await loadPlaylists();
                    } catch (e) {
                      toast.error(e.response?.data?.detail || 'Impossible de charger les playlists');
                    }
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-14 rounded-full bg-white/5 border-white/10 hover:bg-white/10"
                    data-testid="library-owned-add-playlist"
                  >
                    <ListPlus className="w-5 h-5 mr-2" />
                    Ajouter à une playlist
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-heavy border-white/10 rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Ajouter à une playlist</DialogTitle>
                  </DialogHeader>

                  {!creatingPlaylist ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Choisir une playlist</Label>
                        <div className="grid gap-2">
                          {(playlists || []).map((p) => (
                            <button
                              key={p.playlist_id}
                              type="button"
                              onClick={() => setSelectedPlaylistId(p.playlist_id)}
                              className={`text-left p-3 rounded-2xl border transition-colors ${
                                selectedPlaylistId === p.playlist_id
                                  ? 'bg-cyan-500/10 border-cyan-500/30'
                                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                              }`}
                            >
                              <div className="font-medium">{p.name}</div>
                              {p.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">{p.description}</div>
                              )}
                            </button>
                          ))}
                          {(!playlists || playlists.length === 0) && (
                            <div className="text-sm text-muted-foreground">Aucune playlist. Crée-en une.</div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 rounded-full glass border-white/10"
                          onClick={() => setCreatingPlaylist(true)}
                        >
                          Créer une playlist
                        </Button>
                        <Button
                          type="button"
                          className="flex-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0"
                          onClick={handleAddToPlaylist}
                          disabled={addingToPlaylist || !selectedPlaylistId}
                        >
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCreatePlaylist} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nom *</Label>
                        <Input
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          required
                          className="h-12 rounded-xl bg-white/5 border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={newPlaylistDescription}
                          onChange={(e) => setNewPlaylistDescription(e.target.value)}
                          className="h-12 rounded-xl bg-white/5 border-white/10"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 rounded-full glass border-white/10"
                          onClick={() => setCreatingPlaylist(false)}
                        >
                          Retour
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0"
                        >
                          Créer
                        </Button>
                      </div>
                    </form>
                  )}
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                className="w-full h-14 rounded-full bg-white/5 border-white/10 hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-400"
                onClick={toggleLike}
              >
                <Heart className={`w-5 h-5 mr-2 ${heartIconActiveClass(liked)}`} />
                {liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              </Button>

              <div className="space-y-3 pt-4 border-t border-white/10">
                {['Fichier complet sans limite de preview', 'Téléchargement', 'Qualité audio source'].map(
                  (feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {feature}
                    </div>
                  )
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LibraryTrackOwned;
