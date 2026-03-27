import React, { useEffect, useState } from 'react';
import { Plus, Music, Play, Edit, Trash2, Lock, Globe, Heart, User, Disc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { apiClient, resolveApiUrl } from '@/lib/apiClient';
import { fetchLikesSummary } from '@/lib/likes';
import { fetchMyFollows } from '@/lib/follows';

const Playlists = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [likedTracks, setLikedTracks] = useState([]);
  const [likedAlbums, setLikedAlbums] = useState([]);
  const [followedArtists, setFollowedArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' });
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const [{ data: playlistData }, likes, followed] = await Promise.all([
        apiClient.get('/api/playlists'),
        fetchLikesSummary(120),
        fetchMyFollows(120)
      ]);
      setPlaylists(playlistData || []);
      setLikedTracks(
        (likes.tracks || []).map((t) => ({
          ...t,
          cover_url: resolveApiUrl(t?.cover_url),
          preview_url: resolveApiUrl(t?.preview_url)
        }))
      );
      setLikedAlbums(
        (likes.albums || []).map((a) => ({
          ...a,
          cover_url: resolveApiUrl(a?.cover_url)
        }))
      );
      const likedFromApi = (likes.artists || []).map((a) => ({
        ...a,
        picture: resolveApiUrl(a?.picture)
      }));
      const followedResolved = followed.map((a) => ({
        ...a,
        picture: resolveApiUrl(a?.picture)
      }));
      const byId = new Map();
      for (const a of followedResolved) {
        if (a?.user_id) byId.set(a.user_id, a);
      }
      for (const a of likedFromApi) {
        if (a?.user_id && !byId.has(a.user_id)) byId.set(a.user_id, a);
      }
      setFollowedArtists(Array.from(byId.values()));
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

  const openEdit = (playlist) => {
    setEditingPlaylist(playlist);
    setEditForm({ name: playlist.name || '', description: playlist.description || '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingPlaylist) return;
    try {
      const { data } = await apiClient.put(`/api/playlists/${editingPlaylist.playlist_id}`, editForm);
      setPlaylists((prev) => (prev || []).map((p) => (p.playlist_id === data.playlist_id ? data : p)));
      toast.success('Playlist mise à jour');
      setEditingPlaylist(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
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
                        onClick={() => openEdit(playlist)}
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

        <div className="mt-16 md:mt-20 space-y-14 md:space-y-16 border-t border-white/10 pt-14 md:pt-16">
          <section data-testid="playlists-liked-tracks">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <Heart className="w-5 h-5 text-pink-400 fill-pink-400 shrink-0" aria-hidden />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Titres likés</h2>
              <Badge variant="secondary" className="bg-white/10 border-white/10">
                {likedTracks.length}
              </Badge>
            </div>
            {likedTracks.length === 0 ? (
              <p className="text-sm text-muted-foreground glass-heavy rounded-2xl border border-white/10 px-6 py-8 text-center">
                Aucun titre liké pour le moment. Explore le catalogue et clique sur le cœur d’un morceau.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {likedTracks.map((track) => (
                  <button
                    key={track.track_id}
                    type="button"
                    onClick={() => navigate(`/track/${track.track_id}`)}
                    className="group text-left rounded-2xl overflow-hidden glass-heavy border border-white/10 hover:border-cyan-500/30 transition-colors"
                    data-testid={`liked-track-${track.track_id}`}
                  >
                    <div className="aspect-square bg-white/5 relative">
                      {track.cover_url ? (
                        <img
                          src={track.cover_url}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-12 h-12 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium truncate text-sm group-hover:text-cyan-300 transition-colors">
                        {track.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{track.artist_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section data-testid="playlists-liked-albums">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <Disc className="w-5 h-5 text-violet-400 shrink-0" aria-hidden />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Albums likés</h2>
              <Badge variant="secondary" className="bg-white/10 border-white/10">
                {likedAlbums.length}
              </Badge>
            </div>
            {likedAlbums.length === 0 ? (
              <p className="text-sm text-muted-foreground glass-heavy rounded-2xl border border-white/10 px-6 py-8 text-center">
                Aucun album liké pour le moment. Ouvre une page album et clique sur le cœur.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {likedAlbums.map((album) => (
                  <button
                    key={album.album_id}
                    type="button"
                    onClick={() => navigate(`/album/${album.album_id}`)}
                    className="group text-left rounded-2xl overflow-hidden glass-heavy border border-white/10 hover:border-violet-500/30 transition-colors"
                    data-testid={`liked-album-${album.album_id}`}
                  >
                    <div className="aspect-square bg-white/5 relative">
                      {album.cover_url ? (
                        <img
                          src={album.cover_url}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Disc className="w-12 h-12 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium truncate text-sm group-hover:text-violet-300 transition-colors">
                        {album.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {album.artist_name || album.artist_display_name || ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section data-testid="playlists-liked-artists">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <User className="w-5 h-5 text-cyan-400 shrink-0" aria-hidden />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Artistes likés</h2>
              <Badge variant="secondary" className="bg-white/10 border-white/10">
                {followedArtists.length}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
              Suivis depuis la fiche artiste (cœur), ou likés si disponible.
            </p>
            {followedArtists.length === 0 ? (
              <p className="text-sm text-muted-foreground glass-heavy rounded-2xl border border-white/10 px-6 py-8 text-center">
                Aucun artiste pour le moment. Ouvre une fiche artiste et clique sur Suivre.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {followedArtists.map((artist) => {
                  const label = artist.artist_name || artist.name || 'Artiste';
                  return (
                    <button
                      key={artist.user_id}
                      type="button"
                      onClick={() => navigate(`/artist/${artist.user_id}`)}
                      className="group flex flex-col items-center text-center rounded-2xl glass-heavy border border-white/10 hover:border-purple-500/30 px-4 py-6 transition-colors"
                      data-testid={`liked-artist-${artist.user_id}`}
                    >
                      <Avatar className="w-20 h-20 border-2 border-white/10 shadow-lg mb-3 group-hover:border-purple-500/40 transition-colors">
                        <AvatarImage src={artist.picture} alt="" />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-lg font-semibold">
                          {label.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm truncate w-full group-hover:text-purple-300 transition-colors">
                        {label}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <Dialog open={!!editingPlaylist} onOpenChange={(open) => !open && setEditingPlaylist(null)}>
        <DialogContent className="glass-heavy border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Modifier la playlist</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                required
                className="h-12 rounded-xl bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="rounded-xl bg-white/5 border-white/10"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 border-0"
            >
              Enregistrer
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Playlists;