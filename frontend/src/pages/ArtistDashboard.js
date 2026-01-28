import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { 
  Upload, Music, Disc, Plus, Edit, Trash2, Loader2, 
  TrendingUp, DollarSign, Play, Clock, Eye, EyeOff,
  BarChart3, PieChart, Users, Heart, ChevronRight,
  FileAudio, Image, Save, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StatCard = ({ title, value, subtitle, icon: Icon, color = "cyan", trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-heavy rounded-3xl p-6 hover:scale-[1.02] transition-transform"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-${color}-400 to-purple-400`}>
          {value}
        </p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}% vs mois dernier
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-2xl bg-${color}-500/10 flex items-center justify-center border border-${color}-500/30`}>
        <Icon className={`w-6 h-6 text-${color}-400`} />
      </div>
    </div>
  </motion.div>
);

const TrackRow = ({ track, onEdit, onDelete, onTogglePublish }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="glass rounded-2xl p-4 hover:bg-white/5 transition-colors group"
  >
    <div className="flex items-center gap-4">
      {/* Cover */}
      <div className="relative">
        {track.cover_url ? (
          <img src={track.cover_url} alt={track.title} className="w-16 h-16 rounded-xl object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
            <Music className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        {track.status === 'draft' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-background" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold truncate">{track.title}</h4>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="bg-white/5 text-xs">{track.genre}</Badge>
          <span>•</span>
          <span className="text-cyan-400 font-medium">{(track.price / 100).toFixed(2)}€</span>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="font-semibold text-cyan-400">{track.play_count || 0}</p>
          <p className="text-xs text-muted-foreground">Écoutes</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-purple-400">{track.sales_count || 0}</p>
          <p className="text-xs text-muted-foreground">Ventes</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-green-400">{((track.revenue || 0) / 100).toFixed(2)}€</p>
          <p className="text-xs text-muted-foreground">Revenus</p>
        </div>
      </div>

      {/* Status Badge */}
      <Badge 
        className={`${track.status === 'published' 
          ? 'bg-green-500/20 text-green-400 border-green-500/30' 
          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        }`}
      >
        {track.status === 'published' ? 'Publié' : 'Brouillon'}
      </Badge>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full w-9 h-9 hover:bg-white/10"
          onClick={() => onTogglePublish(track)}
          data-testid={`toggle-publish-${track.track_id}`}
        >
          {track.status === 'published' ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full w-9 h-9 hover:bg-cyan-500/10 hover:text-cyan-400"
          onClick={() => onEdit(track)}
          data-testid={`edit-track-${track.track_id}`}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full w-9 h-9 hover:bg-red-500/10 hover:text-red-400"
          onClick={() => onDelete(track)}
          data-testid={`delete-track-${track.track_id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </motion.div>
);

const ArtistDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTrackDialog, setShowTrackDialog] = useState(false);
  const [editingTrack, setEditingTrack] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
    masteringStudio: '',
    bpm: '',
    key: '',
    isrc: '',
    releaseDate: '',
    splits: [{ party: '', percent: '', role: '' }],
    status: 'draft',
    audioFile: null,
    coverFile: null
  });

  useEffect(() => {
    if (user?.role !== 'artist') {
      navigate('/browse');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [statsRes, tracksRes] = await Promise.all([
        axios.get(`${API}/artist/stats`, { withCredentials: true }),
        axios.get(`${API}/artist/tracks`, { withCredentials: true })
      ]);
      setStats(statsRes.data);
      setTracks(tracksRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Use tracks data from stats if available
      if (error.response?.status === 404) {
        try {
          const tracksRes = await axios.get(`${API}/tracks`, { withCredentials: true });
          const myTracks = tracksRes.data.filter(t => t.artist_id === user.user_id);
          setTracks(myTracks);
        } catch (e) {
          console.error('Error fetching tracks:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTrackForm({
      title: '',
      price: '',
      genre: '',
      description: '',
      durationSec: '',
      previewStartSec: 0,
      masteringEngineer: '',
      masteringDetails: '',
      masteringStudio: '',
      bpm: '',
      key: '',
      isrc: '',
      releaseDate: '',
      splits: [{ party: '', percent: '', role: '' }],
      status: 'draft',
      audioFile: null,
      coverFile: null
    });
  };

  const handleEditTrack = (track) => {
    setEditingTrack(track);
    setTrackForm({
      title: track.title,
      price: (track.price / 100).toString(),
      genre: track.genre || '',
      description: track.description || '',
      durationSec: track.duration?.toString() || '',
      previewStartSec: track.preview_start_time || 0,
      masteringEngineer: track.mastering?.engineer || '',
      masteringDetails: track.mastering?.details || '',
      masteringStudio: track.mastering?.studio || '',
      bpm: track.bpm?.toString() || '',
      key: track.key || '',
      isrc: track.isrc || '',
      releaseDate: track.release_date || '',
      splits: track.splits?.length > 0 ? track.splits : [{ party: '', percent: '', role: '' }],
      status: track.status || 'draft',
      audioFile: null,
      coverFile: null
    });
    setShowTrackDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let audioUrl = editingTrack?.preview_url || '';
      let coverUrl = editingTrack?.cover_url || '';

      // Upload audio file if changed
      if (trackForm.audioFile) {
        const audioFormData = new FormData();
        audioFormData.append('file', trackForm.audioFile);
        const audioRes = await axios.post(`${API}/upload/audio`, audioFormData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        audioUrl = BACKEND_URL + audioRes.data.file_url;
      }

      // Upload cover file if changed
      if (trackForm.coverFile) {
        const coverFormData = new FormData();
        coverFormData.append('file', trackForm.coverFile);
        const coverRes = await axios.post(`${API}/upload/cover`, coverFormData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        coverUrl = BACKEND_URL + coverRes.data.cover_url;
      }

      const trackData = {
        title: trackForm.title,
        price: parseFloat(trackForm.price) * 100,
        genre: trackForm.genre,
        description: trackForm.description,
        duration_sec: trackForm.durationSec ? parseInt(trackForm.durationSec) : null,
        preview_start_time: parseInt(trackForm.previewStartSec) || 0,
        mastering: trackForm.masteringEngineer ? {
          engineer: trackForm.masteringEngineer,
          details: trackForm.masteringDetails,
          studio: trackForm.masteringStudio
        } : null,
        bpm: trackForm.bpm ? parseInt(trackForm.bpm) : null,
        key: trackForm.key || null,
        isrc: trackForm.isrc || null,
        release_date: trackForm.releaseDate || null,
        splits: trackForm.splits.filter(s => s.party && s.percent).map(s => ({
          party: s.party,
          percent: parseFloat(s.percent),
          role: s.role || 'Collaborateur'
        })),
        status: trackForm.status
      };

      if (editingTrack) {
        await axios.put(`${API}/tracks/${editingTrack.track_id}`, {
          ...trackData,
          preview_url: audioUrl,
          file_url: audioUrl,
          cover_url: coverUrl
        }, { withCredentials: true });
        toast.success('Track modifié avec succès !');
      } else {
        const trackRes = await axios.post(`${API}/tracks`, trackData, { withCredentials: true });
        if (audioUrl || coverUrl) {
          await axios.put(`${API}/tracks/${trackRes.data.track_id}`, {
            preview_url: audioUrl,
            file_url: audioUrl,
            cover_url: coverUrl
          }, { withCredentials: true });
        }
        toast.success('Track ajouté avec succès !');
      }

      setShowTrackDialog(false);
      setEditingTrack(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'opération');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (track) => {
    if (!window.confirm(`Supprimer "${track.title}" ?`)) return;

    try {
      await axios.delete(`${API}/tracks/${track.track_id}`, { withCredentials: true });
      toast.success('Track supprimé');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleTogglePublish = async (track) => {
    try {
      await axios.put(`${API}/artist/tracks/${track.track_id}/publish`, {}, { withCredentials: true });
      toast.success(track.status === 'published' ? 'Track retiré' : 'Track publié !');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la publication');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <BubbleBackground />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Loader2 className="w-12 h-12 text-cyan-400" />
        </motion.div>
      </div>
    );
  }

  const overview = stats?.overview || {
    total_tracks: tracks.length,
    published_tracks: tracks.filter(t => t.status === 'published').length,
    draft_tracks: tracks.filter(t => t.status !== 'published').length,
    total_sales: 0,
    total_revenue: 0,
    total_play_count: 0,
    total_play_duration_hours: 0
  };

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden">
      <BubbleBackground />
      <GlowOrb color="purple" size={500} x="10%" y="20%" blur={150} />
      <GlowOrb color="cyan" size={400} x="90%" y="70%" blur={120} />

      {/* Header */}
      <div className="relative pt-28 pb-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
          >
            <div>
              <Badge className="mb-4 bg-purple-500/20 text-purple-400 border-purple-500/30">
                Mode Artiste
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter" data-testid="dashboard-title">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Dashboard
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Bienvenue, {user?.artist_name || user?.name}
              </p>
            </div>

            <Button
              size="lg"
              className="rounded-full px-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 border-0 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
              onClick={() => { resetForm(); setEditingTrack(null); setShowTrackDialog(true); }}
              data-testid="new-track-button"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouveau track
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 bg-white/5 border border-white/10 rounded-full p-1.5">
            <TabsTrigger 
              value="overview" 
              className="gap-2 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 px-6"
              data-testid="tab-overview"
            >
              <BarChart3 className="w-4 h-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger 
              value="tracks" 
              className="gap-2 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 px-6"
              data-testid="tab-tracks"
            >
              <Music className="w-4 h-4" />
              Mes tracks ({tracks.length})
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="gap-2 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-cyan-500/20 px-6"
              data-testid="tab-stats"
            >
              <TrendingUp className="w-4 h-4" />
              Statistiques
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Tracks"
                value={overview.total_tracks}
                subtitle={`${overview.published_tracks} publiés`}
                icon={Music}
                color="cyan"
              />
              <StatCard
                title="Ventes"
                value={overview.total_sales}
                icon={DollarSign}
                color="green"
              />
              <StatCard
                title="Revenus"
                value={`${(overview.total_revenue / 100).toFixed(2)}€`}
                icon={TrendingUp}
                color="purple"
              />
              <StatCard
                title="Écoutes"
                value={overview.total_play_count}
                subtitle={`${overview.total_play_duration_hours}h au total`}
                icon={Play}
                color="pink"
              />
            </div>

            {/* Top Tracks */}
            <div className="glass-heavy rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Top Tracks</h3>
                <Button variant="ghost" className="rounded-full" onClick={() => setActiveTab('tracks')}>
                  Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="space-y-3">
                {(stats?.top_tracks || tracks.slice(0, 5)).map((track, idx) => (
                  <div key={track.track_id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <span className="text-2xl font-bold text-muted-foreground w-8">#{idx + 1}</span>
                    {track.cover_url ? (
                      <img src={track.cover_url} alt={track.title} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Music className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{track.title}</p>
                      <p className="text-sm text-muted-foreground">{track.genre}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-400">{((track.revenue || 0) / 100).toFixed(2)}€</p>
                      <p className="text-xs text-muted-foreground">{track.sales_count || 0} ventes</p>
                    </div>
                  </div>
                ))}
                {tracks.length === 0 && (
                  <div className="text-center py-12">
                    <Music className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Aucun track pour le moment</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tracks Tab */}
          <TabsContent value="tracks" className="space-y-4">
            {tracks.length === 0 ? (
              <div className="glass-heavy rounded-3xl p-16 text-center">
                <Music className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucun track</h3>
                <p className="text-muted-foreground mb-6">Commencez par uploader votre premier track</p>
                <Button
                  className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                  onClick={() => { resetForm(); setShowTrackDialog(true); }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un track
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {tracks.map(track => (
                  <TrackRow
                    key={track.track_id}
                    track={track}
                    onEdit={handleEditTrack}
                    onDelete={handleDelete}
                    onTogglePublish={handleTogglePublish}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-8">
            {/* Period Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-heavy rounded-3xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  7 derniers jours
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-3xl font-bold text-cyan-400">{stats?.period_stats?.last_7_days?.sales || 0}</p>
                    <p className="text-sm text-muted-foreground">Ventes</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-400">
                      {((stats?.period_stats?.last_7_days?.revenue || 0) / 100).toFixed(2)}€
                    </p>
                    <p className="text-sm text-muted-foreground">Revenus</p>
                  </div>
                </div>
              </div>

              <div className="glass-heavy rounded-3xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  30 derniers jours
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-3xl font-bold text-purple-400">{stats?.period_stats?.last_30_days?.sales || 0}</p>
                    <p className="text-sm text-muted-foreground">Ventes</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-pink-400">
                      {((stats?.period_stats?.last_30_days?.revenue || 0) / 100).toFixed(2)}€
                    </p>
                    <p className="text-sm text-muted-foreground">Revenus</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Per Track Stats */}
            <div className="glass-heavy rounded-3xl p-6">
              <h3 className="text-lg font-semibold mb-6">Performance par track</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b border-white/10">
                      <th className="pb-4">Track</th>
                      <th className="pb-4 text-right">Prix</th>
                      <th className="pb-4 text-right">Écoutes</th>
                      <th className="pb-4 text-right">Ventes</th>
                      <th className="pb-4 text-right">Revenus</th>
                      <th className="pb-4 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(stats?.track_stats || tracks).map(track => (
                      <tr key={track.track_id} className="hover:bg-white/5">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            {track.cover_url ? (
                              <img src={track.cover_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                <Music className="w-4 h-4" />
                              </div>
                            )}
                            <span className="font-medium">{track.title}</span>
                          </div>
                        </td>
                        <td className="py-4 text-right">{((track.price || 0) / 100).toFixed(2)}€</td>
                        <td className="py-4 text-right text-cyan-400">{track.play_count || 0}</td>
                        <td className="py-4 text-right text-purple-400">{track.sales_count || 0}</td>
                        <td className="py-4 text-right text-green-400">{((track.revenue || 0) / 100).toFixed(2)}€</td>
                        <td className="py-4 text-right">
                          <Badge className={track.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                            {track.status === 'published' ? 'Publié' : 'Brouillon'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Track Dialog */}
      <Dialog open={showTrackDialog} onOpenChange={(open) => { if (!open) { setShowTrackDialog(false); setEditingTrack(null); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-heavy border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingTrack ? 'Modifier le track' : 'Nouveau track'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titre *</Label>
                <Input
                  value={trackForm.title}
                  onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                  className="h-12 rounded-xl bg-white/5 border-white/10"
                  required
                  data-testid="form-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Genre *</Label>
                <Input
                  value={trackForm.genre}
                  onChange={(e) => setTrackForm({ ...trackForm, genre: e.target.value })}
                  className="h-12 rounded-xl bg-white/5 border-white/10"
                  placeholder="Hip-Hop, Electronic, Rock..."
                  required
                  data-testid="form-genre"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={trackForm.description}
                onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })}
                className="rounded-xl bg-white/5 border-white/10"
                rows={3}
                data-testid="form-description"
              />
            </div>

            {/* Price & Duration */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Prix (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={trackForm.price}
                  onChange={(e) => setTrackForm({ ...trackForm, price: e.target.value })}
                  className="h-12 rounded-xl bg-white/5 border-white/10"
                  placeholder="1.99"
                  required
                  data-testid="form-price"
                />
              </div>
              <div className="space-y-2">
                <Label>Durée (sec)</Label>
                <Input
                  type="number"
                  value={trackForm.durationSec}
                  onChange={(e) => setTrackForm({ ...trackForm, durationSec: e.target.value })}
                  className="h-12 rounded-xl bg-white/5 border-white/10"
                  placeholder="180"
                />
              </div>
              <div className="space-y-2">
                <Label>BPM</Label>
                <Input
                  type="number"
                  value={trackForm.bpm}
                  onChange={(e) => setTrackForm({ ...trackForm, bpm: e.target.value })}
                  className="h-12 rounded-xl bg-white/5 border-white/10"
                  placeholder="120"
                />
              </div>
              <div className="space-y-2">
                <Label>Tonalité</Label>
                <Input
                  value={trackForm.key}
                  onChange={(e) => setTrackForm({ ...trackForm, key: e.target.value })}
                  className="h-12 rounded-xl bg-white/5 border-white/10"
                  placeholder="C Major"
                />
              </div>
            </div>

            {/* Preview & Release */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Preview début (sec)</Label>
                <Input
                  type="number"
                  min="0"
                  value={trackForm.previewStartSec}
                  onChange={(e) => setTrackForm({ ...trackForm, previewStartSec: e.target.value })}
                  className="h-12 rounded-xl bg-white/5 border-white/10"
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label>ISRC</Label>
                <Input
                  value={trackForm.isrc}
                  onChange={(e) => setTrackForm({ ...trackForm, isrc: e.target.value })}
                  className="h-12 rounded-xl bg-white/5 border-white/10"
                  placeholder="USRC12345678"
                />
              </div>
              <div className="space-y-2">
                <Label>Date de sortie</Label>
                <Input
                  type="date"
                  value={trackForm.releaseDate}
                  onChange={(e) => setTrackForm({ ...trackForm, releaseDate: e.target.value })}
                  className="h-12 rounded-xl bg-white/5 border-white/10"
                />
              </div>
            </div>

            {/* Mastering Section */}
            <div className="glass rounded-2xl p-4 space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-cyan-400" />
                Mastering
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Ingénieur</Label>
                  <Input
                    value={trackForm.masteringEngineer}
                    onChange={(e) => setTrackForm({ ...trackForm, masteringEngineer: e.target.value })}
                    className="h-12 rounded-xl bg-white/5 border-white/10"
                    placeholder="Nom de l'ingénieur"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Studio</Label>
                  <Input
                    value={trackForm.masteringStudio}
                    onChange={(e) => setTrackForm({ ...trackForm, masteringStudio: e.target.value })}
                    className="h-12 rounded-xl bg-white/5 border-white/10"
                    placeholder="Abbey Road Studios"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Détails techniques</Label>
                  <Input
                    value={trackForm.masteringDetails}
                    onChange={(e) => setTrackForm({ ...trackForm, masteringDetails: e.target.value })}
                    className="h-12 rounded-xl bg-white/5 border-white/10"
                    placeholder="24-bit, 96kHz..."
                  />
                </div>
              </div>
            </div>

            {/* Revenue Splits */}
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-400" />
                  Répartition des revenus
                </h4>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setTrackForm({
                    ...trackForm,
                    splits: [...trackForm.splits, { party: '', percent: '', role: '' }]
                  })}
                >
                  <Plus className="w-4 h-4 mr-1" /> Ajouter
                </Button>
              </div>
              <div className="space-y-3">
                {trackForm.splits.map((split, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <Input
                      className="col-span-4 h-10 rounded-xl bg-white/5 border-white/10"
                      placeholder="Nom"
                      value={split.party}
                      onChange={(e) => {
                        const newSplits = [...trackForm.splits];
                        newSplits[idx].party = e.target.value;
                        setTrackForm({ ...trackForm, splits: newSplits });
                      }}
                    />
                    <Input
                      className="col-span-3 h-10 rounded-xl bg-white/5 border-white/10"
                      placeholder="Rôle"
                      value={split.role}
                      onChange={(e) => {
                        const newSplits = [...trackForm.splits];
                        newSplits[idx].role = e.target.value;
                        setTrackForm({ ...trackForm, splits: newSplits });
                      }}
                    />
                    <Input
                      type="number"
                      className="col-span-3 h-10 rounded-xl bg-white/5 border-white/10"
                      placeholder="%"
                      min="0"
                      max="100"
                      value={split.percent}
                      onChange={(e) => {
                        const newSplits = [...trackForm.splits];
                        newSplits[idx].percent = e.target.value;
                        setTrackForm({ ...trackForm, splits: newSplits });
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="col-span-2 h-10 rounded-xl hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => {
                        if (trackForm.splits.length > 1) {
                          setTrackForm({ ...trackForm, splits: trackForm.splits.filter((_, i) => i !== idx) });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Statut</Label>
              <select
                value={trackForm.status}
                onChange={(e) => setTrackForm({ ...trackForm, status: e.target.value })}
                className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4"
              >
                <option value="draft">Brouillon (non visible)</option>
                <option value="published">Publié (visible par tous)</option>
              </select>
            </div>

            {/* Files */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass rounded-2xl p-4 space-y-3">
                <Label className="flex items-center gap-2">
                  <FileAudio className="w-4 h-4 text-cyan-400" />
                  Fichier audio {!editingTrack && '*'}
                </Label>
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setTrackForm({ ...trackForm, audioFile: e.target.files[0] })}
                  className="rounded-xl bg-white/5 border-white/10"
                  required={!editingTrack}
                  data-testid="form-audio"
                />
                {editingTrack && !trackForm.audioFile && (
                  <p className="text-xs text-green-400">✓ Fichier actuel conservé</p>
                )}
              </div>

              <div className="glass rounded-2xl p-4 space-y-3">
                <Label className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-purple-400" />
                  Cover (image)
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setTrackForm({ ...trackForm, coverFile: e.target.files[0] })}
                  className="rounded-xl bg-white/5 border-white/10"
                  data-testid="form-cover"
                />
                {editingTrack?.cover_url && !trackForm.coverFile && (
                  <p className="text-xs text-green-400">✓ Cover actuelle conservée</p>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 rounded-full"
                onClick={() => { setShowTrackDialog(false); setEditingTrack(null); }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                disabled={submitting}
                data-testid="form-submit"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingTrack ? 'Modification...' : 'Ajout...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingTrack ? 'Enregistrer' : 'Ajouter le track'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArtistDashboard;
