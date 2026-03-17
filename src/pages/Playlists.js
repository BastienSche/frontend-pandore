import React, { useEffect, useState } from 'react';
import { Plus, Music, Play, Edit, Trash2, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { apiClient } from '@/lib/apiClient';

const Playlists = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const { data } = await apiClient.get('/api/playlists');
      setPlaylists(data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    try {
      const { data: created } = await apiClient.post('/api/playlists', newPlaylist);
      toast.success('Playlist créée !');
      setShowCreateDialog(false);
      setNewPlaylist({ name: '', description: '' });
      setPlaylists((prev) => [created, ...(prev || [])]);
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette playlist ?')) return;
    
    try {
      await apiClient.delete(`/api/playlists/${playlistId}`);
      toast.success('Playlist supprimée');
      setPlaylists((prev) => (prev || []).filter((p) => p.playlist_id !== playlistId));
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <BubbleBackground />
        <GlowOrb color="emerald" size={520} x="20%" y="30%" blur={150} />
        <GlowOrb color="cyan" size={420} x="85%" y="70%" blur={130} />
        <div className="relative z-10 animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden">
      <BubbleBackground />
      <GlowOrb color="emerald" size={600} x="15%" y="25%" blur={160} />
      <GlowOrb color="cyan" size={520} x="85%" y="65%" blur={140} />
      <GlowOrb color="purple" size={380} x="55%" y="92%" blur={120} />

      {/* Header */}
      <div className="relative pt-28 pb-10 px-4 md:px-8">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge className="mb-4 bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                Playlists
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4" data-testid="playlists-title">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
                  Mes Playlists
                </span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Organisez votre musique à votre façon
              </p>
            </div>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="rounded-full px-8 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 border-0 shadow-[0_0_30px_rgba(16,185,129,0.25)]"
                  data-testid="create-playlist-button"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Nouvelle playlist
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-heavy border-white/10 rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Créer une playlist</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreatePlaylist} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom *</Label>
                    <Input
                      id="name"
                      value={newPlaylist.name}
                      onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                      required
                      placeholder="Ma playlist"
                      className="h-12 rounded-xl bg-white/5 border-white/10"
                      data-testid="playlist-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newPlaylist.description}
                      onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                      rows={3}
                      placeholder="Décrivez votre playlist..."
                      className="rounded-xl bg-white/5 border-white/10"
                      data-testid="playlist-description-input"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 border-0"
                    data-testid="playlist-submit-button"
                  >
                    Créer
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12 relative z-10">
        {playlists.length === 0 ? (
          <div className="text-center py-24 glass-heavy rounded-[3rem] px-8 md:px-16" data-testid="empty-playlists">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 border border-emerald-500/25 flex items-center justify-center mb-6">
              <Music className="w-10 h-10 text-emerald-300" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Aucune playlist</h3>
            <p className="text-muted-foreground mb-8">Créez votre première playlist pour organiser votre musique</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="rounded-full px-10 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 border-0"
            >
              <Plus className="w-5 h-5 mr-2" />
              Créer une playlist
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map(playlist => (
              <Card
                key={playlist.playlist_id}
                className="group glass-heavy hover:border-white/20 transition-colors rounded-3xl"
                data-testid={`playlist-card-${playlist.playlist_id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{playlist.name}</CardTitle>
                      {playlist.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {playlist.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`ml-2 border ${playlist.visibility === 'public'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-white/5 text-muted-foreground border-white/10'
                      }`}
                    >
                      {playlist.visibility === 'public' ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                      {playlist.visibility === 'public' ? 'Public' : 'Privé'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {playlist.track_ids?.length || 0} titre{playlist.track_ids?.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 border-0"
                        onClick={() => navigate(`/playlist/${playlist.playlist_id}`)}
                        data-testid={`play-playlist-${playlist.playlist_id}`}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Lire
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full glass border-white/15 hover:bg-white/10 hover:border-white/25"
                        data-testid={`edit-playlist-${playlist.playlist_id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full glass border-white/15 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                        onClick={() => handleDeletePlaylist(playlist.playlist_id)}
                        data-testid={`delete-playlist-${playlist.playlist_id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Playlists;