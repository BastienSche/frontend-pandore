import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Heart, ShoppingCart, Music, Loader2, Clock, User, Check, Library } from 'lucide-react';
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

const AlbumDetail = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack, setQueue } = useAudioPlayer();
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get(`/api/albums/${albumId}`);
        const resolvedAlbum = { ...data, cover_url: resolveApiUrl(data?.cover_url) };
        setAlbum(resolvedAlbum);

        const trackIds = data?.track_ids || [];
        if (!trackIds.length) {
          setTracks([]);
        } else {
          const trackResults = await Promise.all(
            trackIds.map((id) => apiClient.get(`/api/tracks/${id}`).then((r) => r.data).catch(() => null))
          );
          setTracks(
            trackResults
              .filter(Boolean)
              .map((t) => ({
                ...t,
                preview_url: resolveApiUrl(t?.preview_url),
                file_url: resolveApiUrl(t?.file_url),
                cover_url: resolveApiUrl(t?.cover_url)
              }))
          );
        }
      } catch (error) {
        toast.error('Album introuvable');
        navigate('/browse');
      } finally {
        setLoading(false);
      }
    })();
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

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const isFree = isFreePrice(album?.price);
      if (isFree) {
        await apiClient.post('/api/purchases/library', {
          item_type: 'album',
          item_id: albumId
        });
        toast.success('Album ajouté à la bibliothèque');
        return;
      }

      const originUrl = window.location.origin;
      const { data } = await apiClient.post('/api/purchases/checkout', {
        item_type: 'album',
        item_id: albumId,
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

  if (!album) return null;

  const priceDisplay = formatPriceLabel(album.price);
  const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);
  const firstTrack = tracks?.[0];
  const isFree = isFreePrice(album?.price);

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden">
      {/* Background Effects */}
      <BubbleBackground />
      <GlowOrb color="cyan" size={520} x="12%" y="28%" blur={150} />
      <GlowOrb color="purple" size={420} x="88%" y="72%" blur={130} />

      {/* Hero */}
      <div className="relative pt-28 pb-10">
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
                {album.cover_url ? (
                  <img
                    src={album.cover_url}
                    alt={album.title}
                    className="w-56 h-56 md:w-72 md:h-72 rounded-3xl shadow-2xl object-cover"
                    data-testid="album-cover-large"
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
                  <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/25">Album</Badge>
                  {album.genre && (
                    <Badge variant="secondary" className="bg-white/5 border-white/10">
                      {album.genre}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {tracks.length} titre{tracks.length > 1 ? 's' : ''}
                  </span>
                  {totalDuration > 0 && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {hours > 0 ? `${hours}h ` : ''}{minutes}min
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight" data-testid="album-title">
                    {album.title}
                  </h1>
                  <button
                    type="button"
                    className="text-left text-muted-foreground hover:text-cyan-300 transition-colors inline-flex items-center gap-2"
                    onClick={() => navigate(`/artist/${album.artist_id}`)}
                    data-testid="album-artist-link"
                  >
                    <User className="w-4 h-4" />
                    <span className="truncate">{album.artist_name}</span>
                  </button>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="rounded-full px-7 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 shadow-[0_0_30px_rgba(34,211,238,0.25)]"
                    onClick={() => {
                      if (tracks?.length) setQueue(tracks, 0);
                      else if (firstTrack) playTrack(firstTrack, { mode: 'preview' });
                    }}
                    disabled={!tracks?.length}
                    data-testid="album-hero-play"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Écouter l’album
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-7 glass border-white/10 hover:bg-white/10"
                    onClick={toggleLike}
                    data-testid="album-like-button"
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
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Description */}
            {album.description && (
              <div className="glass-heavy rounded-3xl p-6 space-y-3">
                <h3 className="font-semibold text-lg">À propos de l’album</h3>
                <p className="text-muted-foreground leading-relaxed">{album.description}</p>
              </div>
            )}

            {/* Tracks */}
            <div className="glass-heavy rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Titres</h3>
                {tracks.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {tracks.length} piste{tracks.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {tracks.map((track, index) => {
                  const isCurrent = currentTrack?.track_id === track.track_id;
                  return (
                    <button
                      key={track.track_id}
                      type="button"
                      className="w-full text-left flex items-center gap-4 p-3 rounded-2xl bg-white/0 hover:bg-white/5 border border-white/0 hover:border-white/10 transition-colors group"
                      onClick={() => playTrack(track, { mode: 'preview' })}
                      data-testid={`album-track-${index}`}
                    >
                      <span className="text-sm text-muted-foreground w-8 text-right tabular-nums">
                        {index + 1}
                      </span>

                      <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        {isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4 text-cyan-300" />
                        ) : (
                          <Play className="w-4 h-4 text-muted-foreground group-hover:text-cyan-300 transition-colors ml-0.5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{track.title}</div>
                        <div className="text-sm text-muted-foreground truncate">{track.genre || album.genre || '—'}</div>
                      </div>

                      {track.duration ? (
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                        </span>
                      ) : null}
                    </button>
                  );
                })}

                {(!tracks || tracks.length === 0) && (
                  <div className="text-sm text-muted-foreground">Aucun titre trouvé pour cet album.</div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Purchase */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="glass-heavy rounded-3xl p-6 space-y-6 sticky top-24">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Prix</p>
                <p
                  className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"
                  data-testid="album-price"
                >
                  {priceDisplay}
                </p>
                {tracks.length > 0 ? (
                  <p className="text-xs text-muted-foreground mt-2">
                    {((album.price / 100) / tracks.length).toFixed(2)}€ par titre
                  </p>
                ) : null}
              </div>

              <Button
                className="w-full h-14 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 text-base font-medium shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] transition-shadow"
                onClick={handlePurchase}
                disabled={purchasing}
                data-testid="purchase-album-button"
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
                        Acheter l’album
                      </>
                    )}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full h-14 rounded-full bg-white/5 border-white/10 hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-400"
                onClick={toggleLike}
                data-testid="album-like-button-secondary"
              >
                <Heart className={`w-5 h-5 mr-2 ${heartIconActiveClass(liked)}`} />
                {liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              </Button>

              <div className="space-y-3 pt-4 border-t border-white/10">
                {[
                  `${tracks.length} titre${tracks.length > 1 ? 's' : ''} inclus`,
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

export default AlbumDetail;