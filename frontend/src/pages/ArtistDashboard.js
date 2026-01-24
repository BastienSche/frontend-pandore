import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { Upload, Music, Disc, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ArtistDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingTrack, setUploadingTrack] = useState(false);
  const [showTrackDialog, setShowTrackDialog] = useState(false);
  const [editingTrack, setEditingTrack] = useState(null);

  // Track form state
  const [trackForm, setTrackForm] = useState({
    title: '',
    price: '',
    genre: '',
    description: '',
    durationSec: '',
    previewStartSec: 0,
    masteringEngineer: '',
    masteringDetails: '',
    splits: [{ party: '', percent: '' }],
    status: 'draft',
    audioFile: null,
    coverFile: null
  });

  useEffect(() => {
    if (user?.role !== 'artist') {
      navigate('/browse');
      return;
    }
    fetchArtistContent();
  }, [user, navigate]);

  const fetchArtistContent = async () => {
    try {
      const [tracksRes, albumsRes] = await Promise.all([
        axios.get(`${API}/tracks`, { withCredentials: true }),
        axios.get(`${API}/albums`, { withCredentials: true })
      ]);
      
      // Filter only artist's content
      setTracks(tracksRes.data.filter(t => t.artist_id === user.user_id));
      setAlbums(albumsRes.data.filter(a => a.artist_id === user.user_id));
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    setUploadingTrack(true);

    try {
      let audioUrl = '';
      let coverUrl = '';

      // Upload audio file
      if (trackForm.audioFile) {
        const audioFormData = new FormData();
        audioFormData.append('file', trackForm.audioFile);
        const audioRes = await axios.post(`${API}/upload/audio`, audioFormData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        audioUrl = audioRes.data.file_url;
      }

      // Upload cover file
      if (trackForm.coverFile) {
        const coverFormData = new FormData();
        coverFormData.append('file', trackForm.coverFile);
        const coverRes = await axios.post(`${API}/upload/cover`, coverFormData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        coverUrl = coverRes.data.cover_url;
      }

      // Create track
      const trackData = {
        title: trackForm.title,
        price: parseFloat(trackForm.price) * 100, // Convert to cents
        genre: trackForm.genre,
        description: trackForm.description,
        duration_sec: trackForm.durationSec ? parseInt(trackForm.durationSec) : null,
        preview_start_time: parseInt(trackForm.previewStartSec) || 0,
        mastering: trackForm.masteringEngineer ? {
          engineer: trackForm.masteringEngineer,
          details: trackForm.masteringDetails
        } : null,
        splits: trackForm.splits.filter(s => s.party && s.percent).map(s => ({
          party: s.party,
          percent: parseFloat(s.percent)
        })),
        status: trackForm.status
      };

      const trackRes = await axios.post(`${API}/tracks`, trackData, {
        withCredentials: true
      });

      // Update track with file URLs
      await axios.put(`${API}/tracks/${trackRes.data.track_id}`, {
        preview_url: BACKEND_URL + audioUrl,
        file_url: BACKEND_URL + audioUrl,
        cover_url: coverUrl ? BACKEND_URL + coverUrl : null
      }, {
        withCredentials: true
      });

      toast.success('Titre ajouté avec succès !');
      setShowTrackDialog(false);
      setTrackForm({
        title: '',
        price: '',
        genre: '',
        description: '',
        durationSec: '',
        previewStartSec: 0,
        masteringEngineer: '',
        masteringDetails: '',
        splits: [{ party: '', percent: '' }],
        status: 'draft',
        audioFile: null,
        coverFile: null
      });
      fetchArtistContent();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'ajout');
    } finally {
      setUploadingTrack(false);
    }
  };

  const handleDeleteTrack = async (trackId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce titre ?')) return;

    try {
      await axios.delete(`${API}/tracks/${trackId}`, {
        withCredentials: true
      });
      toast.success('Titre supprimé');
      fetchArtistContent();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="bg-gradient-to-br from-primary/20 via-background to-background py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4" data-testid="dashboard-title">
                Dashboard Artiste
              </h1>
              <p className="text-lg text-muted-foreground">
                Bienvenue {user?.artist_name}
              </p>
            </div>

            <Dialog open={showTrackDialog} onOpenChange={setShowTrackDialog}>
              <DialogTrigger asChild>
                <Button size="lg" className="rounded-full" data-testid="upload-track-button">
                  <Plus className="w-5 h-5 mr-2" />
                  Nouveau titre
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ajouter un nouveau titre</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTrackSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      value={trackForm.title}
                      onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                      required
                      data-testid="track-title-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Prix (€) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={trackForm.price}
                        onChange={(e) => setTrackForm({ ...trackForm, price: e.target.value })}
                        required
                        data-testid="track-price-input"
                        placeholder="1.99"
                      />
                      <p className="text-xs text-muted-foreground">Prix en euros</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="genre">Genre *</Label>
                      <Input
                        id="genre"
                        value={trackForm.genre}
                        onChange={(e) => setTrackForm({ ...trackForm, genre: e.target.value })}
                        required
                        data-testid="track-genre-input"
                        placeholder="Hip-Hop, Rock, etc."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Durée (secondes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        value={trackForm.durationSec}
                        onChange={(e) => setTrackForm({ ...trackForm, durationSec: e.target.value })}
                        placeholder="180"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="previewStart">Preview début (sec)</Label>
                      <Input
                        id="previewStart"
                        type="number"
                        min="0"
                        value={trackForm.previewStartSec}
                        onChange={(e) => setTrackForm({ ...trackForm, previewStartSec: e.target.value })}
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={trackForm.description}
                      onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })}
                      rows={2}
                      data-testid="track-description-input"
                    />
                  </div>

                  <div className="space-y-3 p-4 border rounded-lg">
                    <h4 className="font-medium">Mastering</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="masteringEngineer">Ingénieur</Label>
                        <Input
                          id="masteringEngineer"
                          value={trackForm.masteringEngineer}
                          onChange={(e) => setTrackForm({ ...trackForm, masteringEngineer: e.target.value })}
                          placeholder="Nom de l'ingénieur"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="masteringDetails">Détails</Label>
                        <Input
                          id="masteringDetails"
                          value={trackForm.masteringDetails}
                          onChange={(e) => setTrackForm({ ...trackForm, masteringDetails: e.target.value })}
                          placeholder="Studio, technique..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Répartition des revenus</h4>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setTrackForm({
                          ...trackForm,
                          splits: [...trackForm.splits, { party: '', percent: '' }]
                        })}
                      >
                        + Ajouter
                      </Button>
                    </div>
                    {trackForm.splits.map((split, index) => (
                      <div key={index} className="grid grid-cols-2 gap-4">
                        <Input
                          placeholder="Nom"
                          value={split.party}
                          onChange={(e) => {
                            const newSplits = [...trackForm.splits];
                            newSplits[index].party = e.target.value;
                            setTrackForm({ ...trackForm, splits: newSplits });
                          }}
                        />
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="%"
                            min="0"
                            max="100"
                            value={split.percent}
                            onChange={(e) => {
                              const newSplits = [...trackForm.splits];
                              newSplits[index].percent = e.target.value;
                              setTrackForm({ ...trackForm, splits: newSplits });
                            }}
                          />
                          {trackForm.splits.length > 1 && (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                const newSplits = trackForm.splits.filter((_, i) => i !== index);
                                setTrackForm({ ...trackForm, splits: newSplits });
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Statut *</Label>
                    <select
                      id="status"
                      value={trackForm.status}
                      onChange={(e) => setTrackForm({ ...trackForm, status: e.target.value })}
                      className="w-full h-12 rounded-xl border border-border bg-background px-3"
                      required
                    >
                      <option value="draft">Brouillon</option>
                      <option value="published">Publié</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Les brouillons ne sont visibles que par vous
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="audio">Fichier audio * (MP3)</Label>
                    <Input
                      id="audio"
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setTrackForm({ ...trackForm, audioFile: e.target.files[0] })}
                      required
                      data-testid="track-audio-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cover">Cover (optionnel)</Label>
                    <Input
                      id="cover"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setTrackForm({ ...trackForm, coverFile: e.target.files[0] })}
                      data-testid="track-cover-input"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={uploadingTrack} data-testid="track-submit-button">
                    {uploadingTrack ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Upload en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Ajouter le titre
                      </>
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <Tabs defaultValue="tracks">
          <TabsList className="mb-8">
            <TabsTrigger value="tracks" className="gap-2" data-testid="dashboard-tracks-tab">
              <Music className="w-4 h-4" />
              Mes titres ({tracks.length})
            </TabsTrigger>
            <TabsTrigger value="albums" className="gap-2" data-testid="dashboard-albums-tab">
              <Disc className="w-4 h-4" />
              Mes albums ({albums.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracks" data-testid="dashboard-tracks-list">
            {tracks.length === 0 ? (
              <div className="text-center py-24">
                <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">Aucun titre</h3>
                <p className="text-muted-foreground mb-6">Commencez par uploader votre premier titre</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tracks.map(track => (
                  <Card key={track.track_id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        {track.cover_url ? (
                          <img src={track.cover_url} alt={track.title} className="w-16 h-16 rounded-lg object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                            <Music className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium" data-testid={`track-name-${track.track_id}`}>{track.title}</h3>
                          <p className="text-sm text-muted-foreground">{track.genre} • ${track.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" data-testid={`edit-track-${track.track_id}`}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTrack(track.track_id)}
                          data-testid={`delete-track-${track.track_id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="albums" data-testid="dashboard-albums-list">
            <div className="text-center py-24">
              <Disc className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Gestion des albums</h3>
              <p className="text-muted-foreground">Fonctionnalité à venir</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ArtistDashboard;