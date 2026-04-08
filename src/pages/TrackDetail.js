import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Heart, ShoppingCart, Music, Loader2, Clock, User, Check, ListPlus, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { apiClient, resolveApiUrl } from '@/lib/apiClient';
import { fetchLikeState, like, unlike } from '@/lib/likes';
import { formatPriceLabel, isFreePrice } from '@/lib/pricing';
import { heartIconActiveClass } from '@/lib/heartIconClass';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const TrackDetail = () => {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack } = useAudioPlayer();
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [addingToPlaylist, setAddingToPlaylist] = useState(false);
  const [payWhatYouWantEuro, setPayWhatYouWantEuro] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get(`/api/tracks/${trackId}`);
        // Normalisation : certaines routes/retours API n'incluent pas exactement les mêmes champs.
        // On force surtout `track_id` pour que `AudioPlayerContext` puisse identifier le titre courant,
        // et on met un fallback de `preview_url` sur `file_url` si la preview manque.
        setTrack({
          ...data,
          track_id: data?.track_id ?? data?.id ?? trackId,
          preview_start_time: data?.preview_start_time ?? data?.preview_start_sec ?? 0,
          preview_duration_sec: data?.preview_duration_sec ?? data?.preview_length_sec ?? null,
          preview_url: data?.preview_url
            ? resolveApiUrl(data?.preview_url)
            : data?.file_url
              ? resolveApiUrl(data?.file_url)
              : null,
          file_url: data?.file_url ? resolveApiUrl(data?.file_url) : null,
          cover_url: data?.cover_url ? resolveApiUrl(data?.cover_url) : null
        });
      } catch (error) {
        toast.error('Track introuvable');
        navigate('/browse');
      } finally {
        setLoading(false);
      }
    })();
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

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const isPayWhatYouWant = !!track?.is_free_price;
      const minCents = track?.min_price != null ? Number(track.min_price) : null;
      const minEuro = minCents != null && Number.isFinite(minCents) ? minCents / 100 : null;

      if (isPayWhatYouWant) {
        const raw = String(payWhatYouWantEuro ?? '').trim().replace(',', '.');
        const n = raw === '' ? NaN : Number(raw);
        if (!Number.isFinite(n) || n < 0) {
          toast.error('Entre un prix valide');
          return;
        }
        if (minEuro != null && n < minEuro) {
          toast.error(`Minimum: ${minEuro.toFixed(2)}€`);
          return;
        }
        const amountCents = Math.round(n * 100);
        if (amountCents === 0) {
          await apiClient.post('/api/purchases/library', { item_type: 'track', item_id: trackId });
          toast.success('Titre ajouté à la bibliothèque');
          return;
        }
        const originUrl = window.location.origin;
        const { data } = await apiClient.post('/api/purchases/checkout', {
          item_type: 'track',
          item_id: trackId,
          origin_url: originUrl,
          amount_cents: amountCents
        });
        if (data?.url) window.location.href = data.url;
        else toast.success('Checkout créé');
        return;
      }

      const isFree = isFreePrice(track?.price);
      if (isFree) {
        await apiClient.post('/api/purchases/library', { item_type: 'track', item_id: trackId });
        toast.success('Titre ajouté à la bibliothèque');
        return;
      }

      const originUrl = window.location.origin;
      const { data } = await apiClient.post('/api/purchases/checkout', {
        item_type: 'track',
        item_id: trackId,
        origin_url: originUrl
      });
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.success('Checkout créé');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'achat");
    } finally {
      setPurchasing(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <BubbleBackground />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-cyan-400" />
        </motion.div>
      </div>
    );
  }

  if (!track) return null;

  const isCurrentTrack = currentTrack?.track_id === track.track_id;
  const priceDisplay = formatPriceLabel(track.price);
  const isFree = isFreePrice(track?.price);
  const isPayWhatYouWant = !!track?.is_free_price;
  const minCents = track?.min_price != null ? Number(track.min_price) : null;
  const minEuro = minCents != null && Number.isFinite(minCents) ? minCents / 100 : null;
  const previewDurationSec =
    track.preview_duration_sec != null &&
    Number.isFinite(Number(track.preview_duration_sec)) &&
    Number(track.preview_duration_sec) > 0
      ? Number(track.preview_duration_sec)
      : 15;

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden">
      {/* Background Effects */}
      <BubbleBackground />
      <GlowOrb color="cyan" size={500} x="10%" y="30%" blur={150} />
      <GlowOrb color="purple" size={400} x="90%" y="70%" blur={120} />

      {/* Hero */}
      <div className="relative pt-28 pb-10">
        {/* Soft cover glow (no harsh black bandeau) */}
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-heavy rounded-[2.5rem] border border-white/10 p-6 md:p-8"
          >
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Cover */}
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
                    data-testid="track-cover-large"
                  />
                ) : (
                  <div className="w-56 h-56 md:w-72 md:h-72 rounded-3xl glass flex items-center justify-center border border-white/10">
                    <Music className="w-20 h-20 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-2xl -z-10" />
              </motion.div>

              {/* Meta */}
              <div className="flex-1 min-w-0 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-cyan-500/15 text-cyan-300 border-cyan-500/25">Track</Badge>
                  <Badge variant="secondary" className="bg-white/5 border-white/10">
                    {track.genre}
                  </Badge>
                  {track.duration && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight" data-testid="track-title">
                    {track.title}
                  </h1>
                  <button
                    type="button"
                    className="text-left text-muted-foreground hover:text-cyan-300 transition-colors inline-flex items-center gap-2"
                    onClick={() => navigate(`/artist/${track.artist_id}`)}
                    data-testid="track-artist-link"
                  >
                    <User className="w-4 h-4" />
                    <span className="truncate">{track.artist_name}</span>
                  </button>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="rounded-full px-7 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 shadow-[0_0_30px_rgba(34,211,238,0.25)]"
                    onClick={() => playTrack(track, { mode: 'preview' })}
                    data-testid="track-hero-play"
                  >
                    {isCurrentTrack && isPlaying ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" /> Écouter le preview
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-7 glass border-white/10 hover:bg-white/10"
                    onClick={toggleLike}
                    data-testid="track-hero-like"
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

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 space-y-6 min-w-0"
          >
            {/* Preview Player */}
            <div className="glass-heavy rounded-3xl p-6">
              <div className="flex items-center gap-4">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    className="rounded-full w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 shadow-[0_0_30px_rgba(34,211,238,0.3)]"
                    onClick={() => playTrack(track, { mode: 'preview' })}
                    data-testid="track-play-button"
                  >
                    {isCurrentTrack && isPlaying ? (
                      <Pause className="w-7 h-7 text-white" />
                    ) : (
                      <Play className="w-7 h-7 text-white ml-1" />
                    )}
                  </Button>
                </motion.div>
                <div>
                  <p className="font-medium">Preview {previewDurationSec} secondes</p>
                  <p className="text-sm text-muted-foreground">
                    De {track.preview_start_time ?? 0}s à {Math.round(
                      (Number(track.preview_start_time) || 0) + previewDurationSec
                    )}
                    s (hors bibliothèque)
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {track.description && (
              <div className="glass-heavy rounded-3xl p-6 space-y-3 min-w-0 max-w-full overflow-hidden">
                <h3 className="font-semibold text-lg">Description</h3>
                <p className="text-muted-foreground leading-relaxed break-words [overflow-wrap:anywhere]">
                  {track.description}
                </p>
              </div>
            )}

            {/* Mastering Info */}
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

            {/* Splits */}
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

          {/* Right Column - Purchase */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="glass-heavy rounded-3xl p-6 space-y-6 sticky top-24">
              {/* Price */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Prix</p>
                <p 
                  className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"
                  data-testid="track-price"
                >
                  {isPayWhatYouWant ? 'Prix libre' : priceDisplay}
                </p>
                {isPayWhatYouWant && (
                  <div className="mt-3 space-y-2">
                    <Label>Ton prix (€){minEuro != null ? ` (min ${minEuro.toFixed(2)}€)` : ''}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={payWhatYouWantEuro}
                      onChange={(e) => setPayWhatYouWantEuro(e.target.value)}
                      className="h-12 rounded-xl bg-white/5 border-white/10"
                      placeholder={minEuro != null ? minEuro.toFixed(2) : '0.00'}
                      data-testid="pay-what-you-want-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      {minEuro != null ? 'Tu peux payer plus si tu veux.' : 'Tu peux mettre 0€ si tu veux.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Purchase Button */}
              <Button
                className="w-full h-14 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 text-base font-medium shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] transition-shadow"
                onClick={handlePurchase}
                disabled={purchasing}
                data-testid="purchase-button"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    {isFree ? (
                      <>
                        <Library className="w-5 h-5 mr-2" />
                        Ajouter à la bibliothèque
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        {isPayWhatYouWant ? 'Continuer' : 'Acheter'}
                      </>
                    )}
                  </>
                )}
              </Button>

              {/* Like Button */}
              <Button 
                variant="outline" 
                className="w-full h-14 rounded-full bg-white/5 border-white/10 hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-400"
                data-testid="like-button"
                onClick={toggleLike}
              >
                <Heart className={`w-5 h-5 mr-2 ${heartIconActiveClass(liked)}`} />
                {liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              </Button>

              {/* Add to playlist */}
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
                    data-testid="add-to-playlist-button"
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
                              {p.description && <div className="text-sm text-muted-foreground line-clamp-1">{p.description}</div>}
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

              {/* Features */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                {[
                  "Téléchargement illimité",
                  "Qualité audio haute définition",
                  "Support direct à l'artiste"
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-cyan-400" />
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

export default TrackDetail;
