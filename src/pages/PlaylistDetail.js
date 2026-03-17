import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Play, Trash2, Music } from 'lucide-react';

import { apiClient, resolveApiUrl } from '@/lib/apiClient';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PlaylistDetail = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const { setQueue } = useAudioPlayer();

  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  const resolvedTracks = useMemo(
    () =>
      (tracks || []).map((t) => ({
        ...t,
        preview_url: resolveApiUrl(t?.preview_url),
        file_url: resolveApiUrl(t?.file_url),
        cover_url: resolveApiUrl(t?.cover_url)
      })),
    [tracks]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: p } = await apiClient.get(`/api/playlists/${playlistId}`);
        setPlaylist(p);

        const ids = p?.track_ids || [];
        if (!ids.length) {
          setTracks([]);
        } else {
          const results = await Promise.all(
            ids.map((id) => apiClient.get(`/api/tracks/${id}`).then((r) => r.data).catch(() => null))
          );
          setTracks(results.filter(Boolean));
        }
      } catch (e) {
        toast.error(e.response?.data?.detail || 'Playlist introuvable');
        navigate('/playlists');
      } finally {
        setLoading(false);
      }
    })();
  }, [playlistId, navigate]);

  const playAll = () => {
    if (!resolvedTracks.length) return;
    setQueue(resolvedTracks, 0);
  };

  const removeTrack = async (trackId) => {
    try {
      await apiClient.delete(`/api/playlists/${playlistId}/tracks/${trackId}`);
      setTracks((prev) => (prev || []).filter((t) => t.track_id !== trackId));
      setPlaylist((prev) => ({
        ...prev,
        track_ids: (prev?.track_ids || []).filter((id) => id !== trackId)
      }));
      toast.success('Retiré de la playlist');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erreur');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <BubbleBackground />
        <GlowOrb color="emerald" size={520} x="20%" y="30%" blur={150} />
        <div className="relative z-10 animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400" />
      </div>
    );
  }

  if (!playlist) return null;

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden">
      <BubbleBackground />
      <GlowOrb color="emerald" size={600} x="15%" y="25%" blur={160} />
      <GlowOrb color="cyan" size={520} x="85%" y="65%" blur={140} />

      <div className="relative pt-28 pb-10 px-4 md:px-8">
        <div className="max-w-6xl mx-auto relative z-10">
          <Badge className="mb-4 bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
            Playlist
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
              {playlist.name}
            </span>
          </h1>
          {playlist.description && <p className="text-muted-foreground">{playlist.description}</p>}

          <div className="mt-6 flex gap-3">
            <Button
              onClick={playAll}
              disabled={!resolvedTracks.length}
              className="rounded-full px-7 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 border-0"
              data-testid="playlist-play-all"
            >
              <Play className="w-4 h-4 mr-2" />
              Lire tout
            </Button>
            <Button
              variant="outline"
              className="rounded-full glass border-white/15"
              onClick={() => navigate('/browse')}
            >
              Ajouter des titres
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
        {resolvedTracks.length === 0 ? (
          <div className="text-center py-24 glass-heavy rounded-[3rem] px-8 md:px-16">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 border border-emerald-500/25 flex items-center justify-center mb-6">
              <Music className="w-10 h-10 text-emerald-300" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Playlist vide</h3>
            <p className="text-muted-foreground mb-8">Ajoutez des titres depuis “Découvrir”.</p>
            <Button
              onClick={() => navigate('/browse')}
              className="rounded-full px-10 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 border-0"
            >
              Aller à Découvrir
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {resolvedTracks.map((t, idx) => (
              <motion.div key={t.track_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="glass-heavy rounded-3xl border-white/10">
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <CardTitle className="truncate">{t.title}</CardTitle>
                        <p className="text-sm text-muted-foreground truncate">{t.artist_name}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="rounded-full"
                          onClick={() => setQueue(resolvedTracks, idx)}
                          data-testid={`playlist-play-${t.track_id}`}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Lire
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-full glass border-white/15 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                          onClick={() => removeTrack(t.track_id)}
                          data-testid={`playlist-remove-${t.track_id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 pt-0" />
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetail;

