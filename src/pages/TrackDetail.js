import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Heart, ShoppingCart, Music, Loader2, Clock, User, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { addToLibrary, getTrackById } from '@/data/fakeData';

const TrackDetail = () => {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack } = useAudioPlayer();
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const found = getTrackById(trackId);
    if (!found) {
      toast.error('Track introuvable');
      navigate('/browse');
      return;
    }
    setTrack(found);
    setLoading(false);
  }, [trackId, navigate]);

  const handlePurchase = async () => {
    setPurchasing(true);
    addToLibrary('track', trackId);
    toast.success('Track ajouté à votre bibliothèque');
    setPurchasing(false);
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
  const priceDisplay = (track.price / 100).toFixed(2);

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden">
      {/* Background Effects */}
      <BubbleBackground />
      <GlowOrb color="cyan" size={500} x="10%" y="30%" blur={150} />
      <GlowOrb color="purple" size={400} x="90%" y="70%" blur={120} />

      {/* Hero Section with Cover */}
      <div className="relative pt-20 pb-12">
        {/* Background Image Blur */}
        {track.cover_url && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20 blur-2xl"
            style={{ backgroundImage: `url(${track.cover_url})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        
        <div className="relative max-w-6xl mx-auto px-6 md:px-12 pt-16">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row items-start gap-8"
          >
            {/* Cover Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative group"
            >
              {track.cover_url ? (
                <img
                  src={track.cover_url}
                  alt={track.title}
                  className="w-64 h-64 md:w-72 md:h-72 rounded-3xl shadow-2xl object-cover"
                  data-testid="track-cover-large"
                />
              ) : (
                <div className="w-64 h-64 md:w-72 md:h-72 rounded-3xl glass-heavy flex items-center justify-center">
                  <Music className="w-24 h-24 text-muted-foreground/30" />
                </div>
              )}
              
              {/* Glow effect */}
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            </motion.div>
            
            {/* Track Info */}
            <div className="flex-1 space-y-4">
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                TRACK
              </Badge>
              
              <h1 
                className="text-4xl md:text-6xl font-bold tracking-tighter"
                data-testid="track-title"
              >
                {track.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-lg">
                <span
                  className="text-muted-foreground hover:text-cyan-400 cursor-pointer transition-colors flex items-center gap-2"
                  onClick={() => navigate(`/artist/${track.artist_id}`)}
                  data-testid="track-artist-link"
                >
                  <User className="w-4 h-4" />
                  {track.artist_name}
                </span>
                <span className="text-muted-foreground/50">•</span>
                <Badge variant="secondary" className="bg-white/5 border-white/10">
                  {track.genre}
                </Badge>
                {track.duration && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </>
                )}
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
            className="lg:col-span-2 space-y-6"
          >
            {/* Preview Player */}
            <div className="glass-heavy rounded-3xl p-6">
              <div className="flex items-center gap-4">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    className="rounded-full w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 shadow-[0_0_30px_rgba(34,211,238,0.3)]"
                    onClick={() => playTrack(track)}
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
                  <p className="font-medium">Preview 15 secondes</p>
                  <p className="text-sm text-muted-foreground">Commence à {track.preview_start_time}s</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {track.description && (
              <div className="glass-heavy rounded-3xl p-6 space-y-3">
                <h3 className="font-semibold text-lg">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{track.description}</p>
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
                  {priceDisplay}€
                </p>
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
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Acheter
                  </>
                )}
              </Button>

              {/* Like Button */}
              <Button 
                variant="outline" 
                className="w-full h-14 rounded-full bg-white/5 border-white/10 hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-400"
                data-testid="like-button"
              >
                <Heart className="w-5 h-5 mr-2" />
                Ajouter aux favoris
              </Button>

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
