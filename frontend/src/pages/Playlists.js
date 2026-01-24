import React, { useEffect, useState } from 'react';
import axios from 'axios';
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
      const response = await axios.get(`${API}/playlists`, { withCredentials: true });
      setPlaylists(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/playlists`, newPlaylist, { withCredentials: true });
      toast.success('Playlist créée !');
      setShowCreateDialog(false);
      setNewPlaylist({ name: '', description: '' });
      fetchPlaylists();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette playlist ?')) return;
    
    try {
      await axios.delete(`${API}/playlists/${playlistId}`, { withCredentials: true });
      toast.success('Playlist supprimée');
      fetchPlaylists();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="bg-gradient-to-br from-primary/20 via-background to-background py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4" data-testid="playlists-title">
                Mes Playlists
              </h1>
              <p className="text-lg text-muted-foreground">
                Organisez votre musique à votre façon
              </p>
            </div>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="lg" className="rounded-full" data-testid="create-playlist-button">
                  <Plus className="w-5 h-5 mr-2" />
                  Nouvelle playlist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une playlist</DialogTitle>
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
                      data-testid="playlist-description-input"
                    />
                  </div>
                  <Button type="submit" className="w-full" data-testid="playlist-submit-button">
                    Créer
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {playlists.length === 0 ? (
          <div className="text-center py-24" data-testid="empty-playlists">
            <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Aucune playlist</h3>
            <p className="text-muted-foreground mb-6">Créez votre première playlist pour organiser votre musique</p>
            <Button onClick={() => setShowCreateDialog(true)} className="rounded-full">
              <Plus className="w-5 h-5 mr-2" />
              Créer une playlist
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map(playlist => (
              <Card key={playlist.playlist_id} className="group hover:shadow-lg transition-all" data-testid={`playlist-card-${playlist.playlist_id}`}>
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
                    <Badge variant={playlist.visibility === 'public' ? 'default' : 'secondary'} className="ml-2">
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
                        variant="default"
                        className="flex-1 rounded-full"
                        onClick={() => navigate(`/playlist/${playlist.playlist_id}`)}
                        data-testid={`play-playlist-${playlist.playlist_id}`}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Lire
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        data-testid={`edit-playlist-${playlist.playlist_id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
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