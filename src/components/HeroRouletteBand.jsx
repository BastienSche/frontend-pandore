import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient, normalizeApiList, resolveApiUrl } from '@/lib/apiClient';

export default function HeroRouletteBand({ tracks: tracksProp }) {
  const [tracks, setTracks] = useState(Array.isArray(tracksProp) ? tracksProp : []);
  const [loading, setLoading] = useState(!Array.isArray(tracksProp));
  const [rouletteTrack, setRouletteTrack] = useState(null);
  const [rouletteSpinning, setRouletteSpinning] = useState(false);
  const [rouletteAddLoading, setRouletteAddLoading] = useState(false);

  useEffect(() => {
    if (Array.isArray(tracksProp)) return;
    let mounted = true;
    (async () => {
      try {
        const tracksResp = await apiClient.get('/api/tracks?limit=80');
        const list = normalizeApiList(tracksResp.data).map((t) => ({
          ...t,
          preview_url: resolveApiUrl(t?.preview_url),
          file_url: resolveApiUrl(t?.file_url),
          cover_url: resolveApiUrl(t?.cover_url)
        }));
        if (mounted) setTracks(list);
      } catch {
        // ignore: component shows fallback
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [tracksProp]);

  const freeCandidates = useMemo(() => {
    const list = Array.isArray(tracks) ? tracks : [];
    return list.filter((t) => {
      const isPayWhatYouWant = !!t?.is_free_price;
      const min = t?.min_price;
      const hasMin = min != null && Number.isFinite(Number(min)) && Number(min) > 0;
      if (isPayWhatYouWant) return !hasMin;
      const cents = Number(t?.price ?? 0);
      return Number.isFinite(cents) && cents === 0;
    });
  }, [tracks]);

  const spinRoulette = async () => {
    if (rouletteSpinning) return;
    setRouletteSpinning(true);
    setRouletteTrack(null);
    try {
      await new Promise((r) => setTimeout(r, 650));
      if (!freeCandidates.length) {
        toast.message("Pas de son gratuit dispo pour l’instant");
        return;
      }
      const pick = freeCandidates[Math.floor(Math.random() * freeCandidates.length)];
      setRouletteTrack(pick);
      toast.success("Tu as gagné un son gratuit !");
    } finally {
      setRouletteSpinning(false);
    }
  };

  const addRouletteToLibrary = async () => {
    if (!rouletteTrack?.track_id) return;
    setRouletteAddLoading(true);
    try {
      await apiClient.post('/api/purchases/library', {
        item_type: 'track',
        item_id: rouletteTrack.track_id
      });
      toast.success("Ajouté à ta bibliothèque");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Impossible d’ajouter à la bibliothèque");
    } finally {
      setRouletteAddLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto glass-heavy rounded-3xl border border-white/10 px-5 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        <motion.div
          animate={{ rotate: rouletteSpinning ? 360 : 0 }}
          transition={{
            duration: rouletteSpinning ? 0.7 : 0.2,
            repeat: rouletteSpinning ? Infinity : 0,
            ease: 'linear'
          }}
          className="mx-auto sm:mx-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-white/10 flex items-center justify-center"
          aria-hidden="true"
        >
          <Sparkles className="w-6 h-6 text-cyan-300" />
        </motion.div>

        <div className="flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/25">Roulette</Badge>
            <span className="text-sm text-muted-foreground">
              Tente de gagner un son gratuit
              {loading ? '…' : ''}
            </span>
          </div>
          <div className="mt-2">
            {rouletteTrack ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base sm:text-lg font-semibold truncate">{rouletteTrack.title}</div>
                  <div className="text-sm text-muted-foreground truncate">{rouletteTrack.artist_name}</div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Link to={`/track/${rouletteTrack.track_id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full glass border-white/15 hover:bg-white/10"
                      data-testid="roulette-listen"
                    >
                      Écouter
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0"
                    onClick={addRouletteToLibrary}
                    disabled={rouletteAddLoading}
                    data-testid="roulette-add-library"
                  >
                    {rouletteAddLoading ? 'Ajout...' : 'Ajouter à ma bibliothèque'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Clique sur “Tourner” pour tirer un track gratuit au hasard.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center sm:justify-end">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full glass border-white/20 hover:bg-white/10 hover:border-white/30"
            onClick={spinRoulette}
            disabled={loading || rouletteSpinning}
            data-testid="roulette-spin"
          >
            {rouletteSpinning ? 'Ça tourne...' : 'Tourner'}
          </Button>
        </div>
      </div>
    </div>
  );
}

