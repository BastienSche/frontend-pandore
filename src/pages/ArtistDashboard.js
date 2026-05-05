import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  Upload, Music, Disc, Plus, Edit, Trash2, Loader2, 
  TrendingUp, DollarSign, Play, Clock, Eye, EyeOff,
  BarChart3, PieChart, Users, Heart, ChevronRight,
  FileAudio, Image, Save, X, Library
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
import { apiClient, resolveApiUrl } from '@/lib/apiClient';
import { Progress } from '@/components/ui/progress';
import { formatPriceLabel } from '@/lib/pricing';
import { splitGenreTags } from '@/lib/genreTags';
import { fieldFocusRingSelect, fieldInnerSurface, fieldRing } from '@/lib/fieldStyles';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

const parsePriceEuroInput = (raw) => {
  const v = String(raw ?? '').trim();
  if (!v) return null;
  const normalized = v.replace(',', '.');
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
};

/** Aligne les libellés (prix / prix libre / durée, etc.) sur une même ligne de base. */
const priceStepLabelRow = 'min-h-[2.75rem] flex items-end shrink-0';

/** Durée du fichier audio en secondes (`duration` / `duration_sec`). */
const trackAudioDurationSec = (track) => {
  const v = track?.duration ?? track?.duration_sec;
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Durée du morceau affichée (ex. 3:24). */
const formatTrackLengthClock = (track) => {
  const sec = trackAudioDurationSec(track);
  if (sec == null) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/** Temps d'écoute cumulé (stats) : secondes → minutes ou heures. */
const formatCumulativeListenTime = (playDurationSec) => {
  const v = Number(playDurationSec);
  if (!Number.isFinite(v) || v <= 0) return '—';
  if (v < 3600) return `${(v / 60).toFixed(1)} min`;
  return `${(v / 3600).toFixed(1)} h`;
};

/** Stats list payloads often omit description / mastering / splits; full track from GET /api/tracks/:id has them. */
const normalizeReleaseDateForInput = (d) => {
  if (d == null || d === '') return '';
  const s = String(d);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : s.slice(0, 10);
};

const buildTrackFormFromApiTrack = (track) => {
  const priceCents = track?.price;
  const priceStr =
    priceCents != null && Number.isFinite(Number(priceCents))
      ? (Number(priceCents) / 100).toString()
      : '';
  const minPriceCents = track?.min_price;
  const minPriceStr =
    minPriceCents != null && minPriceCents !== '' && Number.isFinite(Number(minPriceCents))
      ? (Number(minPriceCents) / 100).toString()
      : '';

  const dur = track?.duration_sec ?? track?.duration;
  const durationSec = dur != null && dur !== '' ? String(dur) : '';

  const previewRaw = track?.preview_start_time ?? track?.preview_start_sec ?? 0;
  const previewStartSec = Number.isFinite(Number(previewRaw))
    ? Number(previewRaw)
    : parseInt(String(previewRaw), 10) || 0;

  const previewDurRaw = track?.preview_duration_sec ?? track?.preview_length_sec;
  const previewDurationSec =
    previewDurRaw != null && previewDurRaw !== '' && Number.isFinite(Number(previewDurRaw)) && Number(previewDurRaw) > 0
      ? String(Number(previewDurRaw))
      : '15';

  const splits =
    track?.splits?.length > 0
      ? track.splits.map((s) => ({
          party: s.party ?? '',
          role: s.role ?? '',
          percent: s.percent != null && s.percent !== '' ? String(s.percent) : ''
        }))
      : [{ party: '', percent: '', role: '' }];

  const m = track?.mastering;
  return {
    title: track?.title ?? '',
    price: priceStr,
    isFreePrice: !!track?.is_free_price,
    minPrice: minPriceStr,
    genre: track?.genre ?? '',
    description: track?.description ?? '',
    durationSec,
    previewStartSec,
    previewDurationSec,
    masteringEngineer: m?.engineer ?? '',
    masteringDetails: m?.details ?? '',
    masteringStudio: m?.studio ?? '',
    bpm: track?.bpm != null && track?.bpm !== '' ? String(track.bpm) : '',
    key: track?.key ?? '',
    isrc: track?.isrc ?? '',
    releaseDate: normalizeReleaseDateForInput(track?.release_date),
    mixVersion: track?.mix_version ?? '',
    availability: track?.availability ?? '',
    producer: track?.producer ?? '',
    beatmaker: track?.beatmaker ?? '',
    splits,
    status: track?.status || 'draft',
    audioFile: null,
    coverFile: null
  };
};

/** Gradients / surfaces / icônes en classes statiques (obligatoire pour Tailwind JIT). */
const STAT_CARD_STYLES = {
  cyan: {
    value: 'from-cyan-400 to-sky-400',
    iconWrap: 'border-cyan-400/35 bg-cyan-500/[0.12]',
    icon: 'text-cyan-200',
    panel:
      'border-cyan-200/50 bg-gradient-to-br from-cyan-50/90 via-white to-slate-50/60 dark:border-cyan-500/20 dark:bg-gradient-to-br dark:from-cyan-950/40 dark:via-zinc-900/80 dark:to-zinc-950',
  },
  green: {
    value: 'from-emerald-400 to-green-400',
    iconWrap: 'border-emerald-400/35 bg-emerald-500/[0.12]',
    icon: 'text-emerald-200',
    panel:
      'border-emerald-200/50 bg-gradient-to-br from-emerald-50/90 via-white to-slate-50/60 dark:border-emerald-500/20 dark:bg-gradient-to-br dark:from-emerald-950/35 dark:via-zinc-900/80 dark:to-zinc-950',
  },
  orange: {
    value: 'from-orange-400 to-amber-400',
    iconWrap: 'border-orange-400/35 bg-orange-500/[0.12]',
    icon: 'text-orange-200',
    panel:
      'border-orange-200/50 bg-gradient-to-br from-orange-50/90 via-white to-slate-50/60 dark:border-orange-500/20 dark:bg-gradient-to-br dark:from-orange-950/35 dark:via-zinc-900/80 dark:to-zinc-950',
  },
  purple: {
    value: 'from-fuchsia-400 to-purple-400',
    iconWrap: 'border-purple-400/35 bg-purple-500/[0.12]',
    icon: 'text-purple-200',
    panel:
      'border-purple-200/50 bg-gradient-to-br from-purple-50/90 via-white to-slate-50/60 dark:border-purple-500/20 dark:bg-gradient-to-br dark:from-purple-950/40 dark:via-zinc-900/80 dark:to-zinc-950',
  },
  pink: {
    value: 'from-pink-400 to-rose-400',
    iconWrap: 'border-pink-400/35 bg-pink-500/[0.12]',
    icon: 'text-pink-200',
    panel:
      'border-pink-200/50 bg-gradient-to-br from-pink-50/90 via-white to-slate-50/60 dark:border-pink-500/20 dark:bg-gradient-to-br dark:from-pink-950/35 dark:via-zinc-900/80 dark:to-zinc-950',
  },
  violet: {
    value: 'from-violet-400 to-fuchsia-400',
    iconWrap: 'border-violet-400/35 bg-violet-500/[0.12]',
    icon: 'text-violet-200',
    panel:
      'border-violet-200/50 bg-gradient-to-br from-violet-50/90 via-white to-slate-50/60 dark:border-violet-500/20 dark:bg-gradient-to-br dark:from-violet-950/40 dark:via-zinc-900/80 dark:to-zinc-950',
  },
};

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'cyan', trend }) => {
  const s = STAT_CARD_STYLES[color] || STAT_CARD_STYLES.cyan;
  const displayValue = value === undefined || value === null ? '—' : value;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      title={typeof title === 'string' ? title : undefined}
      className={cn(
        'flex min-h-0 w-full min-w-0 gap-2.5 overflow-hidden rounded-xl border p-3 shadow-sm transition-[box-shadow,transform] hover:-translate-y-px hover:shadow-md dark:shadow-black/25',
        s.panel
      )}
    >
      <div className="flex w-full min-w-0 items-center gap-2.5">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border shadow-inner',
            s.iconWrap
          )}
          aria-hidden
        >
          <Icon className={cn('h-4 w-4', s.icon)} strokeWidth={2} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
          <p className="line-clamp-1 text-[10px] font-semibold uppercase leading-tight tracking-[0.1em] text-muted-foreground">
            {title}
          </p>
          <p
            className={cn(
              'truncate text-xl font-bold tabular-nums leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-r',
              s.value
            )}
          >
            {displayValue}
          </p>
          {subtitle ? (
            <p className="line-clamp-2 break-words text-[11px] leading-snug text-muted-foreground">{subtitle}</p>
          ) : null}
          {trend ? (
            <div className={cn('flex items-center gap-1 text-[11px]', trend > 0 ? 'text-green-400' : 'text-red-400')}>
              <TrendingUp className={cn('h-3 w-3 shrink-0', trend < 0 ? 'rotate-180' : '')} />
              {Math.abs(trend)}% vs mois dernier
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

const TrackRow = ({ track, onEdit, onDelete, onTogglePublish }) => {
  const genreTags = splitGenreTags(track.genre);
  return (
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
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {genreTags.map((g, i) => (
            <Badge key={`dash-genre-${track.track_id}-${i}`} variant="secondary" className="bg-white/5 text-xs whitespace-nowrap max-w-[10rem] truncate" title={g}>
              {g}
            </Badge>
          ))}
          {genreTags.length > 0 && <span className="text-muted-foreground/60">•</span>}
          <span className="text-cyan-400 font-medium">
            {formatPriceLabel(track.price)}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden md:flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm">
        <div className="text-center min-w-[3.25rem]">
          <p className="font-semibold text-cyan-400">{track.play_count || 0}</p>
          <p className="text-xs text-muted-foreground">Écoutes</p>
        </div>
        <div className="text-center min-w-[3.25rem]">
          <p className="font-semibold text-sky-400 tabular-nums">{formatTrackLengthClock(track)}</p>
          <p className="text-xs text-muted-foreground">Durée</p>
        </div>
        <div className="text-center min-w-[4rem]">
          <p className="font-semibold text-teal-400 tabular-nums">{formatCumulativeListenTime(track.play_duration_sec)}</p>
          <p className="text-xs text-muted-foreground">Écouté</p>
        </div>
        <div className="text-center min-w-[3.25rem]">
          <p className="font-semibold text-purple-400">{track.sales_count || 0}</p>
          <p className="text-xs text-muted-foreground">Ventes</p>
        </div>
        <div className="text-center min-w-[3.5rem]">
          <p className="font-semibold text-green-400">{((track.revenue || 0) / 100).toFixed(2)}€</p>
          <p className="text-xs text-muted-foreground">Revenus</p>
        </div>
      </div>
      <p className="md:hidden text-xs text-muted-foreground mt-1.5">
        {track.play_count || 0} écoutes · {formatTrackLengthClock(track)} morceau ·{' '}
        {formatCumulativeListenTime(track.play_duration_sec)} écouté
      </p>

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
};

const AlbumRow = ({ album, onEdit, onDelete, onTogglePublish }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="glass rounded-2xl p-4 hover:bg-white/5 transition-colors group"
  >
    <div className="flex items-center gap-4">
      <div className="relative">
        {album.cover_url ? (
          <img src={album.cover_url} alt={album.title} className="w-16 h-16 rounded-xl object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Disc className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        {album.status === 'draft' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-background" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-semibold truncate">{album.title}</h4>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="bg-white/5 text-xs">ALBUM</Badge>
          <span>•</span>
          <span>{album.track_ids?.length || 0} titres</span>
          <span>•</span>
          <span className="text-purple-300 font-medium">
            {formatPriceLabel(album.price)}
          </span>
          {album.play_count != null && album.play_count > 0 && (
            <>
              <span>•</span>
              <span>{album.play_count} écoutes</span>
            </>
          )}
          {album.likes_count != null && album.likes_count > 0 && (
            <>
              <span>•</span>
              <span>{album.likes_count} likes</span>
            </>
          )}
        </div>
      </div>

      <Badge
        className={`${album.status === 'published'
          ? 'bg-green-500/20 text-green-400 border-green-500/30'
          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        }`}
      >
        {album.status === 'published' ? 'Publié' : 'Brouillon'}
      </Badge>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full w-9 h-9 hover:bg-white/10"
          onClick={() => onTogglePublish(album)}
          data-testid={`toggle-publish-album-${album.album_id}`}
        >
          {album.status === 'published' ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full w-9 h-9 hover:bg-purple-500/10 hover:text-purple-300"
          onClick={() => onEdit(album)}
          data-testid={`edit-album-${album.album_id}`}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full w-9 h-9 hover:bg-red-500/10 hover:text-red-400"
          onClick={() => onDelete(album)}
          data-testid={`delete-album-${album.album_id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </motion.div>
);

const ArtistDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTrackDialog, setShowTrackDialog] = useState(false);
  const [editingTrack, setEditingTrack] = useState(null);
  const [showAlbumDialog, setShowAlbumDialog] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [trackStep, setTrackStep] = useState(0);
  const [albumStep, setAlbumStep] = useState(0);

  // Track form state
  const [trackForm, setTrackForm] = useState({
    title: '',
    price: '',
    isFreePrice: false,
    minPrice: '',
    genre: '',
    description: '',
    durationSec: '',
    previewStartSec: 0,
    previewDurationSec: '15',
    masteringEngineer: '',
    masteringDetails: '',
    masteringStudio: '',
    bpm: '',
    key: '',
    isrc: '',
    releaseDate: '',
    mixVersion: '',
    availability: '',
    producer: '',
    beatmaker: '',
    splits: [{ party: '', percent: '', role: '' }],
    status: 'draft',
    audioFile: null,
    coverFile: null
  });

  const [albumForm, setAlbumForm] = useState({
    title: '',
    price: '',
    isFreePrice: false,
    minPrice: '',
    description: '',
    mixVersion: '',
    availability: '',
    producer: '',
    beatmaker: '',
    trackIds: [],
    albumTracks: [],
    status: 'draft',
    coverFile: null
  });

  const [connectStatus, setConnectStatus] = useState(null);
  const [connectBalance, setConnectBalance] = useState(null);
  const [connectActionLoading, setConnectActionLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'artist') return;
    (async () => {
      try {
        const { data } = await apiClient.get('/api/artist/stripe/connect/status');
        setConnectStatus(data);
        if (data?.has_account && data?.charges_enabled) {
          try {
            const { data: bal } = await apiClient.get('/api/artist/stripe/connect/balance');
            setConnectBalance(bal);
          } catch {
            setConnectBalance(null);
          }
        } else {
          setConnectBalance(null);
        }
      } catch {
        setConnectStatus(null);
        setConnectBalance(null);
      }
    })();
  }, [user, authLoading]);

  const startStripeOnboarding = async () => {
    setConnectActionLoading(true);
    try {
      const { data } = await apiClient.post('/api/artist/stripe/connect/onboard');
      if (data?.url) window.location.href = data.url;
      else toast.error("Pas d'URL Stripe");
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erreur Stripe');
    } finally {
      setConnectActionLoading(false);
    }
  };

  const openStripeExpress = async () => {
    try {
      const { data } = await apiClient.post('/api/artist/stripe/connect/login-link');
      if (data?.url) window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erreur');
    }
  };

  useEffect(() => {
    // Wait for auth to load before checking role
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'artist') {
      navigate('/browse');
      return;
    }
    (async () => {
      try {
        const { data } = await apiClient.get('/api/artist/stats');
        const trackStats = (data?.track_stats || []).map((t) => ({
          ...t,
          preview_url: resolveApiUrl(t?.preview_url),
          file_url: resolveApiUrl(t?.file_url),
          cover_url: resolveApiUrl(t?.cover_url)
        }));
        const albumStats = (data?.album_stats || []).map((a) => ({
          ...a,
          cover_url: resolveApiUrl(a?.cover_url)
        }));
        const topTracks = (data?.top_tracks || []).map((t) => ({
          ...t,
          preview_url: resolveApiUrl(t?.preview_url),
          file_url: resolveApiUrl(t?.file_url),
          cover_url: resolveApiUrl(t?.cover_url)
        }));
        setStats({
          ...data,
          track_stats: trackStats,
          album_stats: albumStats,
          top_tracks: topTracks
        });
        setTracks(trackStats);
        setAlbums(albumStats);
      } catch (error) {
        toast.error(error.response?.data?.detail || "Erreur lors du chargement du dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, navigate]);

  const reloadStats = async () => {
    const { data } = await apiClient.get('/api/artist/stats');
    const trackStats = (data?.track_stats || []).map((t) => ({
      ...t,
      preview_url: resolveApiUrl(t?.preview_url),
      file_url: resolveApiUrl(t?.file_url),
      cover_url: resolveApiUrl(t?.cover_url)
    }));
    const albumStats = (data?.album_stats || []).map((a) => ({
      ...a,
      cover_url: resolveApiUrl(a?.cover_url)
    }));
    const topTracks = (data?.top_tracks || []).map((t) => ({
      ...t,
      preview_url: resolveApiUrl(t?.preview_url),
      file_url: resolveApiUrl(t?.file_url),
      cover_url: resolveApiUrl(t?.cover_url)
    }));
    const mergedStats = {
      ...data,
      track_stats: trackStats,
      album_stats: albumStats,
      top_tracks: topTracks
    };
    setStats(mergedStats);
    setTracks(trackStats);
    setAlbums(albumStats);
    return { stats: mergedStats, tracks: trackStats, albums: albumStats };
  };

  const resetForm = () => {
    setTrackForm({
      title: '',
      price: '',
      isFreePrice: false,
      minPrice: '',
      genre: '',
      description: '',
      durationSec: '',
      previewStartSec: 0,
      previewDurationSec: '15',
      masteringEngineer: '',
      masteringDetails: '',
      masteringStudio: '',
      bpm: '',
      key: '',
      isrc: '',
      releaseDate: '',
      mixVersion: '',
      availability: '',
      producer: '',
      beatmaker: '',
      splits: [{ party: '', percent: '', role: '' }],
      status: 'draft',
      audioFile: null,
      coverFile: null
    });
    setTrackStep(0);
  };

  const resetAlbumForm = () => {
    setAlbumForm({
      title: '',
      price: '',
      isFreePrice: false,
      minPrice: '',
      description: '',
      mixVersion: '',
      availability: '',
      producer: '',
      beatmaker: '',
      trackIds: [],
      albumTracks: [],
      status: 'draft',
      coverFile: null
    });
    setAlbumStep(0);
  };

  const handleEditTrack = async (track) => {
    setTrackStep(0);
    let merged = { ...track };
    try {
      const { data } = await apiClient.get(`/api/tracks/${track.track_id}`);
      merged = { ...track, ...data };
    } catch {
      // Liste dashboard sans tous les champs : on garde la ligne stats
    }
    merged = {
      ...merged,
      preview_url: resolveApiUrl(merged.preview_url),
      file_url: resolveApiUrl(merged.file_url),
      cover_url: resolveApiUrl(merged.cover_url)
    };
    setEditingTrack(merged);
    setTrackForm(buildTrackFormFromApiTrack(merged));
    setShowTrackDialog(true);
  };

  const closeTrackDialog = () => {
    setShowTrackDialog(false);
    setEditingTrack(null);
    setTrackStep(0);
  };

  const handleEditAlbum = (album) => {
    setEditingAlbum(album);
    setAlbumForm({
      title: album.title,
      price: (album.price / 100).toString(),
      isFreePrice: !!album?.is_free_price,
      minPrice: album?.min_price != null && Number.isFinite(Number(album?.min_price))
        ? (Number(album.min_price) / 100).toString()
        : '',
      description: album.description || '',
      mixVersion: album?.mix_version || '',
      availability: album?.availability || '',
      producer: album?.producer || '',
      beatmaker: album?.beatmaker || '',
      trackIds: album.track_ids || [],
      albumTracks: [],
      status: album.status || 'draft',
      coverFile: null
    });
    setAlbumStep(0);
    setShowAlbumDialog(true);
  };

  const closeAlbumDialog = () => {
    setShowAlbumDialog(false);
    setEditingAlbum(null);
    setAlbumStep(0);
  };

  const canGoNextAlbum = () => {
    if (albumStep === 0) return !!albumForm.title?.trim();
    if (albumStep === 1) {
      if (albumForm.isFreePrice) {
        const min = parsePriceEuroInput(albumForm.minPrice);
        return min === null || min >= 0;
      }
      return parsePriceEuroInput(albumForm.price) !== null;
    }
    if (albumStep === 2) return (albumForm.trackIds?.length || 0) > 0 || (albumForm.albumTracks?.length || 0) > 0;
    return true;
  };

  const nextAlbumStep = () => {
    if (!canGoNextAlbum()) {
      toast.error('Complète les champs requis');
      return;
    }
    setAlbumStep((s) => Math.min(s + 1, 3));
  };

  const prevAlbumStep = () => setAlbumStep((s) => Math.max(s - 1, 0));

  const canGoNext = () => {
    if (trackStep === 0) return !!trackForm.title?.trim() && !!trackForm.genre?.trim();
    if (trackStep === 1) {
      if (trackForm.isFreePrice) {
        const min = parsePriceEuroInput(trackForm.minPrice);
        return min === null || min >= 0;
      }
      return parsePriceEuroInput(trackForm.price) !== null;
    }
    return true;
  };

  const nextStep = () => {
    if (!canGoNext()) {
      toast.error('Complète les champs requis');
      return;
    }
    setTrackStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => setTrackStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const priceEuro = trackForm.isFreePrice ? 0 : parsePriceEuroInput(trackForm.price);
      if (!trackForm.isFreePrice && priceEuro === null) {
        toast.error('Prix invalide');
        return;
      }
      const minPriceEuro = parsePriceEuroInput(trackForm.minPrice);
      if (trackForm.isFreePrice && minPriceEuro !== null && minPriceEuro < 0) {
        toast.error('Minimum invalide');
        return;
      }
      const trackData = {
        title: trackForm.title,
        price: Math.round((priceEuro || 0) * 100),
        is_free_price: !!trackForm.isFreePrice,
        min_price: trackForm.isFreePrice
          ? (minPriceEuro === null ? null : Math.round(minPriceEuro * 100))
          : null,
        genre: trackForm.genre,
        description: trackForm.description,
        duration_sec: trackForm.durationSec ? parseInt(trackForm.durationSec) : null,
        preview_start_time: parseInt(trackForm.previewStartSec, 10) || 0,
        preview_duration_sec: Math.max(1, parseInt(trackForm.previewDurationSec, 10) || 15),
        mastering: trackForm.masteringEngineer ? {
          engineer: trackForm.masteringEngineer,
          details: trackForm.masteringDetails,
          studio: trackForm.masteringStudio
        } : null,
        bpm: trackForm.bpm ? parseInt(trackForm.bpm) : null,
        key: trackForm.key || null,
        isrc: trackForm.isrc || null,
        release_date: trackForm.releaseDate || null,
        mix_version: trackForm.mixVersion || null,
        availability: trackForm.availability || null,
        producer: trackForm.producer || null,
        beatmaker: trackForm.beatmaker || null,
        splits: trackForm.splits.filter(s => s.party && s.percent).map(s => ({
          party: s.party,
          percent: parseFloat(s.percent),
          role: s.role || 'Collaborateur'
        })),
        status: trackForm.status
      };

      let trackId = editingTrack?.track_id;
      if (editingTrack) {
        await apiClient.put(`/api/tracks/${trackId}`, trackData);
      } else {
        const { data: created } = await apiClient.post('/api/tracks', trackData);
        trackId = created?.track_id;
      }

      if (trackId && (trackForm.audioFile || trackForm.coverFile)) {
        const update = {};
        if (trackForm.audioFile) {
          const fd = new FormData();
          fd.append('file', trackForm.audioFile);
          const { data: upload } = await apiClient.post('/api/upload/audio', fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          update.file_url = upload?.file_url || null;
          update.preview_url = upload?.file_url || null;
        }
        if (trackForm.coverFile) {
          const fd = new FormData();
          fd.append('file', trackForm.coverFile);
          const { data: upload } = await apiClient.post('/api/upload/cover', fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          update.cover_url = upload?.cover_url || null;
        }
        if (Object.keys(update).length) {
          await apiClient.put(`/api/tracks/${trackId}`, update);
        }
      }

      await reloadStats();
      toast.success(editingTrack ? 'Track modifié avec succès !' : 'Track ajouté avec succès !');

      setShowTrackDialog(false);
      setEditingTrack(null);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'opération');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (track) => {
    if (!window.confirm(`Supprimer "${track.title}" ?`)) return;

    try {
      await apiClient.delete(`/api/tracks/${track.track_id}`);
      await reloadStats();
      toast.success('Track supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleTogglePublish = async (track) => {
    try {
      await apiClient.put(`/api/artist/tracks/${track.track_id}/publish`);
      await reloadStats();
      toast.success(track.status === 'published' ? 'Track retiré' : 'Track publié !');
    } catch (error) {
      toast.error('Erreur lors de la publication');
    }
  };

  const handleSubmitAlbum = async () => {
    setSubmitting(true);

    try {
      const priceEuro = albumForm.isFreePrice ? 0 : parsePriceEuroInput(albumForm.price);
      if (!albumForm.isFreePrice && priceEuro === null) {
        toast.error('Prix invalide');
        return;
      }
      const minPriceEuro = parsePriceEuroInput(albumForm.minPrice);
      if (albumForm.isFreePrice && minPriceEuro !== null && minPriceEuro < 0) {
        toast.error('Minimum invalide');
        return;
      }

      // Album tracks must be created as album-only items (backend support required).
      // Strategy: ensure we have an album_id, then create tracks under that album.
      let albumId = editingAlbum?.album_id;
      if (!albumId) {
        const { data: createdAlbum } = await apiClient.post('/api/albums', {
          title: albumForm.title,
          price: Math.round((priceEuro || 0) * 100),
          is_free_price: !!albumForm.isFreePrice,
          min_price: albumForm.isFreePrice
            ? (minPriceEuro === null ? null : Math.round(minPriceEuro * 100))
            : null,
          description: albumForm.description,
          mix_version: albumForm.mixVersion || null,
          availability: albumForm.availability || null,
          producer: albumForm.producer || null,
          beatmaker: albumForm.beatmaker || null,
          track_ids: [],
          status: 'draft'
        });
        albumId = createdAlbum?.album_id;
      } else {
        await apiClient.put(`/api/albums/${albumId}`, {
          title: albumForm.title,
          price: Math.round((priceEuro || 0) * 100),
          is_free_price: !!albumForm.isFreePrice,
          min_price: albumForm.isFreePrice
            ? (minPriceEuro === null ? null : Math.round(minPriceEuro * 100))
            : null,
          description: albumForm.description,
          mix_version: albumForm.mixVersion || null,
          availability: albumForm.availability || null,
          producer: albumForm.producer || null,
          beatmaker: albumForm.beatmaker || null,
          track_ids: albumForm.trackIds || [],
          status: albumForm.status
        });
      }

      if (!albumId) {
        toast.error('Erreur: album non créé');
        return;
      }

      // Create tracks defined inside album dialog (optional)
      const createdTrackIds = [];
      for (const [idx, t] of (albumForm.albumTracks || []).entries()) {
        const tTitle = (t?.title || '').trim();
        const tGenre = (t?.genre || '').trim();
        const tIsFreePrice = !!t?.isFreePrice;
        const tPriceEuro = tIsFreePrice ? 0 : parsePriceEuroInput(t?.price);
        const tMinPriceEuro = parsePriceEuroInput(t?.minPrice);

        if (!tTitle) {
          toast.error(`Track #${idx + 1}: titre requis`);
          return;
        }
        if (!tGenre) {
          toast.error(`Track #${idx + 1}: genre requis`);
          return;
        }
        if (!tIsFreePrice && tPriceEuro === null) {
          toast.error(`Track #${idx + 1}: prix invalide`);
          return;
        }
        if (tIsFreePrice && tMinPriceEuro !== null && tMinPriceEuro < 0) {
          toast.error(`Track #${idx + 1}: minimum invalide`);
          return;
        }

        const trackData = {
          title: tTitle,
          price: Math.round((tPriceEuro || 0) * 100),
          is_free_price: !!tIsFreePrice,
          min_price: tIsFreePrice
            ? (tMinPriceEuro === null ? null : Math.round(tMinPriceEuro * 100))
            : null,
          genre: tGenre,
          description: t?.description || '',
          status: t?.status || 'draft'
        };

        let created;
        try {
          const res = await apiClient.post(`/api/albums/${albumId}/tracks`, trackData);
          created = res?.data;
        } catch (err) {
          const status = err?.response?.status;
          if (status === 404 || status === 405) {
            toast.error("Le backend doit exposer `POST /api/albums/:albumId/tracks` pour créer des tracks uniquement dans un album.");
            return;
          }
          throw err;
        }
        const trackId = created?.track_id;
        if (!trackId) {
          toast.error('Erreur: track non créé');
          return;
        }
        createdTrackIds.push(trackId);

        const update = {};
        if (t?.audioFile) {
          const fd = new FormData();
          fd.append('file', t.audioFile);
          const { data: upload } = await apiClient.post('/api/upload/audio', fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          update.file_url = upload?.file_url || null;
          update.preview_url = upload?.file_url || null;
        }
        if (t?.coverFile) {
          const fd = new FormData();
          fd.append('file', t.coverFile);
          const { data: upload } = await apiClient.post('/api/upload/cover', fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          update.cover_url = upload?.cover_url || null;
        }
        if (Object.keys(update).length) {
          await apiClient.put(`/api/albums/${albumId}/tracks/${trackId}`, update);
        }
      }

      const mergedTrackIds = [...new Set([...(albumForm.trackIds || []), ...createdTrackIds])];
      if (!mergedTrackIds.length) {
        toast.error('Ajoute au moins un track à l’album');
        return;
      }

      const albumData = {
        title: albumForm.title,
        price: Math.round((priceEuro || 0) * 100),
        is_free_price: !!albumForm.isFreePrice,
        min_price: albumForm.isFreePrice
          ? (minPriceEuro === null ? null : Math.round(minPriceEuro * 100))
          : null,
        description: albumForm.description,
        mix_version: albumForm.mixVersion || null,
        availability: albumForm.availability || null,
        producer: albumForm.producer || null,
        beatmaker: albumForm.beatmaker || null,
        track_ids: mergedTrackIds,
        status: albumForm.status
      };

      await apiClient.put(`/api/albums/${albumId}`, albumData);

      if (albumId && albumForm.coverFile) {
        const fd = new FormData();
        fd.append('file', albumForm.coverFile);
        const { data: upload } = await apiClient.post('/api/upload/cover', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        await apiClient.put(`/api/albums/${albumId}`, { cover_url: upload?.cover_url || null });
      }

      await reloadStats();
      toast.success(editingAlbum ? 'Album modifié avec succès !' : 'Album ajouté avec succès !');
      setShowAlbumDialog(false);
      setEditingAlbum(null);
      resetAlbumForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'opération');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAlbum = async (album) => {
    if (!window.confirm(`Supprimer "${album.title}" ?`)) return;
    try {
      await apiClient.delete(`/api/albums/${album.album_id}`);
      await reloadStats();
      toast.success('Album supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleTogglePublishAlbum = async (album) => {
    try {
      await apiClient.put(`/api/artist/albums/${album.album_id}/publish`);
      await reloadStats();
      toast.success(album.status === 'published' ? 'Album retiré' : 'Album publié !');
    } catch (error) {
      toast.error('Erreur lors de la publication');
    }
  };

  // Show loading while auth is checking
  if (authLoading || loading) {
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
    total_library_adds: 0,
    total_revenue: 0,
    total_play_count: 0,
    total_play_duration_sec: 0,
    total_play_duration_hours: 0,
    total_likes_tracks: 0,
    total_likes_albums: 0
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

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="rounded-full px-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 border-0 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
                onClick={() => { resetForm(); setEditingTrack(null); setShowTrackDialog(true); }}
                data-testid="new-track-button"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nouveau track
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 glass border-white/15 hover:bg-white/10"
                onClick={() => { resetAlbumForm(); setEditingAlbum(null); setShowAlbumDialog(true); }}
                data-testid="new-album-button"
              >
                <Disc className="w-5 h-5 mr-2" />
                Nouvel album
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 bg-slate-50 border border-slate-200 text-foreground shadow-sm dark:bg-white/5 dark:border-white/10 dark:shadow-none rounded-full p-1.5">
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
              value="albums" 
              className="gap-2 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 px-6"
              data-testid="tab-albums"
            >
              <Disc className="w-4 h-4" />
              Mes albums ({albums.length})
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-3">
              <StatCard
                title="Tracks"
                value={overview.total_tracks}
                subtitle={`${overview.published_tracks} publié(s)`}
                icon={Music}
                color="cyan"
              />
              <StatCard
                title="Ventes"
                value={overview.total_sales ?? 0}
                subtitle="Achats confirmés"
                icon={DollarSign}
                color="green"
              />
              <StatCard
                title="Bibliothèque"
                value={overview.total_library_adds ?? 0}
                subtitle="Ajouts gratuits"
                icon={Library}
                color="orange"
              />
              <StatCard
                title="Revenus"
                value={`${(Number(overview.total_revenue) / 100).toFixed(2)} €`}
                subtitle="Achats payants"
                icon={TrendingUp}
                color="purple"
              />
              <StatCard
                title="Écoutes"
                value={overview.total_play_count ?? 0}
                subtitle={(() => {
                  const sec = Number(overview.total_play_duration_sec);
                  const h = Number(overview.total_play_duration_hours);
                  if (Number.isFinite(sec) && sec > 0) {
                    const min = Math.round(sec / 60);
                    return `${min} min cumulées${Number.isFinite(h) && h > 0 ? ` (${h} h)` : ''}`;
                  }
                  return `${Number.isFinite(h) ? h : 0} h cumulées`;
                })()}
                icon={Play}
                color="pink"
              />
              <StatCard
                title="Likes"
                value={(overview.total_likes_tracks ?? 0) + (overview.total_likes_albums ?? 0)}
                subtitle="Tracks & albums"
                icon={Heart}
                color="violet"
              />
            </div>

            <div className="glass-heavy rounded-3xl p-6 border border-emerald-500/20">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    Paiements & versements (Stripe Connect)
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                    Les achats passent par Stripe : la part vendeur (après commission plateforme{' '}
                    {connectStatus?.platform_fee_percent ?? '—'}%) est créditée sur ton compte connecté.
                    Les virements vers ton IBAN sont gérés par Stripe (Express). Le seuil minimum avant premier
                    virement dépend du pays et du compte — indicatif souvent autour de{' '}
                    {connectBalance?.min_payout_hint_euros ?? 20}
                    € ; détail dans l&apos;espace Stripe Express.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {!connectStatus?.has_account || !connectStatus?.charges_enabled ? (
                    <Button
                      className="rounded-full bg-emerald-600 hover:bg-emerald-500"
                      disabled={connectActionLoading}
                      onClick={startStripeOnboarding}
                    >
                      {connectActionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Activer les paiements
                    </Button>
                  ) : (
                    <Button variant="outline" className="rounded-full" onClick={openStripeExpress}>
                      Ouvrir Stripe Express
                    </Button>
                  )}
                </div>
              </div>
              {connectStatus?.has_account && connectStatus?.charges_enabled && connectBalance && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white/5 p-4">
                    <p className="text-muted-foreground">Disponible (Stripe)</p>
                    <p className="text-lg font-semibold">
                      {(Number(connectBalance.available_cents || 0) / 100).toFixed(2)}{' '}
                      {String(connectBalance.currency || 'eur').toUpperCase()}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-4">
                    <p className="text-muted-foreground">En attente</p>
                    <p className="text-lg font-semibold">
                      {(Number(connectBalance.pending_cents || 0) / 100).toFixed(2)}{' '}
                      {String(connectBalance.currency || 'eur').toUpperCase()}
                    </p>
                  </div>
                </div>
              )}
              {connectStatus && connectStatus.connect_enabled === false && (
                <p className="text-xs text-amber-500/90 mt-3">
                  Connect désactivé côté API (STRIPE_CONNECT_ENABLED) — les ventes restent sur le compte plateforme.
                </p>
              )}
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
                    <div className="text-right space-y-0.5">
                      <p className="font-semibold text-green-400">{((track.revenue || 0) / 100).toFixed(2)}€</p>
                      <p className="text-xs text-muted-foreground">
                        {track.play_count || 0} écoutes · {formatTrackLengthClock(track)} ·{' '}
                        {formatCumulativeListenTime(track.play_duration_sec)} écouté
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {track.sales_count || 0} ventes · {track.library_adds_count ?? 0} biblio
                      </p>
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

          {/* Albums Tab */}
          <TabsContent value="albums" className="space-y-4">
            {albums.length === 0 ? (
              <div className="glass-heavy rounded-3xl p-16 text-center">
                <Disc className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucun album</h3>
                <p className="text-muted-foreground mb-6">Créez votre premier album</p>
                <Button
                  className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                  onClick={() => { resetAlbumForm(); setShowAlbumDialog(true); }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un album
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {albums.map(album => (
                  <AlbumRow
                    key={album.album_id}
                    album={album}
                    onEdit={handleEditAlbum}
                    onDelete={handleDeleteAlbum}
                    onTogglePublish={handleTogglePublishAlbum}
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-3xl font-bold text-cyan-400">{stats?.period_stats?.last_7_days?.sales || 0}</p>
                    <p className="text-sm text-muted-foreground">Ventes (payant)</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-orange-400">{stats?.period_stats?.last_7_days?.library_adds ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Biblio (7 j)</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-3xl font-bold text-purple-400">{stats?.period_stats?.last_30_days?.sales || 0}</p>
                    <p className="text-sm text-muted-foreground">Ventes (payant)</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-orange-400">{stats?.period_stats?.last_30_days?.library_adds ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Biblio (30 j)</p>
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
                      <th className="pb-4 text-right">Durée</th>
                      <th className="pb-4 text-right">Temps écouté</th>
                      <th className="pb-4 text-right">Ventes</th>
                      <th className="pb-4 text-right">Biblio</th>
                      <th className="pb-4 text-right">Likes</th>
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
                        <td className="py-4 text-right">
                          {formatPriceLabel(track.price || 0)}
                        </td>
                        <td className="py-4 text-right text-cyan-400 tabular-nums">{track.play_count || 0}</td>
                        <td className="py-4 text-right text-sky-400 tabular-nums text-sm">{formatTrackLengthClock(track)}</td>
                        <td className="py-4 text-right text-teal-400 tabular-nums text-sm">{formatCumulativeListenTime(track.play_duration_sec)}</td>
                        <td className="py-4 text-right text-purple-400">{track.sales_count || 0}</td>
                        <td className="py-4 text-right text-orange-400">{track.library_adds_count ?? 0}</td>
                        <td className="py-4 text-right text-pink-400">{track.likes_count ?? 0}</td>
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
      <Dialog open={showTrackDialog} onOpenChange={(open) => { if (!open) closeTrackDialog(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-heavy border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingTrack ? 'Modifier le track' : 'Nouveau track'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Étape {trackStep + 1}/4</span>
                <span>{trackStep === 0 ? 'Infos' : trackStep === 1 ? 'Prix' : trackStep === 2 ? 'Fichiers' : 'Avancé'}</span>
              </div>
              <Progress value={((trackStep + 1) / 4) * 100} />
            </div>

            {/* Basic Info */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${trackStep !== 0 ? 'hidden' : ''}`}>
              <div className="space-y-2">
                <Label>Titre *</Label>
                <Input
                  value={trackForm.title}
                  onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                  className="h-12 rounded-[10px]"
                  required
                  data-testid="form-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Genre *</Label>
                <Input
                  value={trackForm.genre}
                  onChange={(e) => setTrackForm({ ...trackForm, genre: e.target.value })}
                  className="h-12 rounded-[10px]"
                  placeholder="Hip-Hop, Electronic, Rock..."
                  required
                  data-testid="form-genre"
                />
              </div>
            </div>

            <div className={`space-y-2 ${trackStep !== 0 ? 'hidden' : ''}`}>
              <Label>Description</Label>
              <Textarea
                value={trackForm.description}
                onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })}
                className="min-h-[88px] rounded-[10px]"
                rows={3}
                data-testid="form-description"
              />
            </div>

            {/* Price & Duration */}
            <div className={`space-y-4 ${trackStep !== 1 ? 'hidden' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <div className={priceStepLabelRow}>
                    <Label htmlFor="track-form-price">Prix (€) *</Label>
                  </div>
                  <Input
                    id="track-form-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={trackForm.price}
                    onChange={(e) => setTrackForm({ ...trackForm, price: e.target.value })}
                    className="h-12 rounded-[10px]"
                    placeholder="1.99"
                    required={!trackForm.isFreePrice}
                    disabled={trackForm.isFreePrice}
                    data-testid="form-price"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ou active <span className="text-purple-300 font-medium">Prix libre</span> au centre
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className={priceStepLabelRow}>
                    <Label className="flex items-center gap-2 font-normal cursor-pointer leading-snug">
                      <Checkbox
                        checked={trackForm.isFreePrice}
                        onCheckedChange={(v) => {
                          const next = !!v;
                          setTrackForm({
                            ...trackForm,
                            isFreePrice: next,
                            price: next ? '0' : trackForm.price
                          });
                        }}
                        data-testid="form-free-price"
                      />
                      Prix libre (l’utilisateur choisit le prix)
                    </Label>
                  </div>
                  <Input
                    id="track-form-free-price-min"
                    type="number"
                    step="0.01"
                    min="0"
                    value={trackForm.minPrice}
                    onChange={(e) => setTrackForm({ ...trackForm, minPrice: e.target.value })}
                    className={`h-12 rounded-[10px] ${!trackForm.isFreePrice ? 'opacity-50 pointer-events-none' : ''}`}
                    placeholder="Minimum (optionnel)"
                    aria-label="Minimum (optionnel)"
                    disabled={!trackForm.isFreePrice}
                    data-testid="form-free-price-min"
                  />
                  <p className="text-xs text-muted-foreground">Laisse vide pour “pas de minimum”.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className={priceStepLabelRow}>
                    <Label htmlFor="track-form-duration">Durée (sec)</Label>
                  </div>
                  <Input
                    id="track-form-duration"
                    type="number"
                    value={trackForm.durationSec}
                    onChange={(e) => setTrackForm({ ...trackForm, durationSec: e.target.value })}
                    className="h-12 rounded-[10px]"
                    placeholder="180"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className={priceStepLabelRow}>
                    <Label htmlFor="track-form-bpm">BPM</Label>
                  </div>
                  <Input
                    id="track-form-bpm"
                    type="number"
                    value={trackForm.bpm}
                    onChange={(e) => setTrackForm({ ...trackForm, bpm: e.target.value })}
                    className="h-12 rounded-[10px]"
                    placeholder="120"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className={priceStepLabelRow}>
                    <Label htmlFor="track-form-key">Tonalité</Label>
                  </div>
                  <Input
                    id="track-form-key"
                    value={trackForm.key}
                    onChange={(e) => setTrackForm({ ...trackForm, key: e.target.value })}
                    className="h-12 rounded-[10px]"
                    placeholder="C Major"
                  />
                </div>
              </div>
            </div>

            {/* Preview & Release */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${trackStep !== 1 ? 'hidden' : ''}`}>
              <div className="space-y-2">
                <Label>Preview début (sec)</Label>
                <Input
                  type="number"
                  min="0"
                  value={trackForm.previewStartSec}
                  onChange={(e) => setTrackForm({ ...trackForm, previewStartSec: e.target.value })}
                  className="h-12 rounded-[10px]"
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label>Durée preview (sec)</Label>
                <Input
                  type="number"
                  min="1"
                  max="600"
                  value={trackForm.previewDurationSec}
                  onChange={(e) => setTrackForm({ ...trackForm, previewDurationSec: e.target.value })}
                  className="h-12 rounded-[10px]"
                  placeholder="15"
                />
              </div>
              <div className="space-y-2">
                <Label>ISRC</Label>
                <Input
                  value={trackForm.isrc}
                  onChange={(e) => setTrackForm({ ...trackForm, isrc: e.target.value })}
                  className="h-12 rounded-[10px]"
                  placeholder="USRC12345678"
                />
              </div>
              <div className="space-y-2">
                <Label>Date de sortie</Label>
                <Input
                  type="date"
                  value={trackForm.releaseDate}
                  onChange={(e) => setTrackForm({ ...trackForm, releaseDate: e.target.value })}
                  className="h-12 rounded-[10px]"
                />
              </div>
            </div>

            {/* Mastering Section */}
            <div className={`glass rounded-2xl p-4 space-y-4 ${trackStep !== 3 ? 'hidden' : ''}`}>
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
                    className="h-12 rounded-[10px]"
                    placeholder="Nom de l'ingénieur"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Studio</Label>
                  <Input
                    value={trackForm.masteringStudio}
                    onChange={(e) => setTrackForm({ ...trackForm, masteringStudio: e.target.value })}
                    className="h-12 rounded-[10px]"
                    placeholder="Abbey Road Studios"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Détails techniques</Label>
                  <Input
                    value={trackForm.masteringDetails}
                    onChange={(e) => setTrackForm({ ...trackForm, masteringDetails: e.target.value })}
                    className="h-12 rounded-[10px]"
                    placeholder="24-bit, 96kHz..."
                  />
                </div>
              </div>
            </div>

            {/* Revenue Splits */}
            <div className={`glass rounded-2xl p-4 space-y-4 ${trackStep !== 3 ? 'hidden' : ''}`}>
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
                  <div
                    key={idx}
                    className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <Input
                        className="h-10 rounded-[10px]"
                        placeholder="Nom"
                        value={split.party}
                        onChange={(e) => {
                          const newSplits = [...trackForm.splits];
                          newSplits[idx].party = e.target.value;
                          setTrackForm({ ...trackForm, splits: newSplits });
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Input
                        className="h-10 rounded-[10px]"
                        placeholder="Rôle"
                        value={split.role}
                        onChange={(e) => {
                          const newSplits = [...trackForm.splits];
                          newSplits[idx].role = e.target.value;
                          setTrackForm({ ...trackForm, splits: newSplits });
                        }}
                      />
                    </div>
                    <div className="min-w-0 w-full sm:w-[5.5rem] sm:flex-none sm:shrink-0">
                      <Input
                        type="number"
                        className="h-10 rounded-[10px]"
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
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 self-end sm:self-auto rounded-xl hover:bg-red-500/10 hover:text-red-400"
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
            <div className={`space-y-2 ${trackStep !== 3 ? 'hidden' : ''}`}>
              <Label>Statut</Label>
              <div className={fieldRing}>
                <select
                  value={trackForm.status}
                  onChange={(e) => setTrackForm({ ...trackForm, status: e.target.value })}
                  className={cn(
                    'h-12 w-full rounded-[10px] px-4 py-2.5 text-sm',
                    fieldInnerSurface,
                    fieldFocusRingSelect
                  )}
                >
                  <option value="draft">Brouillon (non visible)</option>
                  <option value="published">Publié (visible par tous)</option>
                </select>
              </div>
            </div>

            {/* Track Meta */}
            <div className={`glass rounded-2xl p-4 space-y-4 ${trackStep !== 3 ? 'hidden' : ''}`}>
              <h4 className="font-semibold flex items-center gap-2">
                <Library className="w-4 h-4 text-purple-300" />
                Infos release
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Version</Label>
                  <div className={fieldRing}>
                    <select
                      value={trackForm.mixVersion}
                      onChange={(e) => setTrackForm({ ...trackForm, mixVersion: e.target.value })}
                      className={cn(
                        'h-12 w-full rounded-[10px] px-4 py-2.5 text-sm',
                        fieldInnerSurface,
                        fieldFocusRingSelect
                      )}
                    >
                      <option value="">—</option>
                      <option value="maquette">Maquette</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Disponibilité</Label>
                  <div className={fieldRing}>
                    <select
                      value={trackForm.availability}
                      onChange={(e) => setTrackForm({ ...trackForm, availability: e.target.value })}
                      className={cn(
                        'h-12 w-full rounded-[10px] px-4 py-2.5 text-sm',
                        fieldInnerSurface,
                        fieldFocusRingSelect
                      )}
                    >
                      <option value="">—</option>
                      <option value="exclusive">Kloud Exclusive Only</option>
                      <option value="all_platforms">Dispo sur toutes les plateformes</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Producteur</Label>
                  <Input
                    value={trackForm.producer}
                    onChange={(e) => setTrackForm({ ...trackForm, producer: e.target.value })}
                    className="h-12 rounded-[10px]"
                    placeholder="Nom du producteur"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Beatmaker</Label>
                  <Input
                    value={trackForm.beatmaker}
                    onChange={(e) => setTrackForm({ ...trackForm, beatmaker: e.target.value })}
                    className="h-12 rounded-[10px]"
                    placeholder="Nom du beatmaker"
                  />
                </div>
              </div>
            </div>

            {/* Files */}
            <div className={`grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 ${trackStep !== 2 ? 'hidden' : ''}`}>
              <div className="glass min-w-0 space-y-3 rounded-2xl p-4">
                <Label className="flex items-center gap-2">
                  <FileAudio className="w-4 h-4 text-cyan-400" />
                  Fichier audio {!editingTrack && '*'}
                </Label>
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setTrackForm({ ...trackForm, audioFile: e.target.files[0] })}
                  className="w-full max-w-full rounded-[10px]"
                  required={!editingTrack}
                  data-testid="form-audio"
                />
                {editingTrack && !trackForm.audioFile && (
                  <p className="text-xs text-green-400">✓ Fichier actuel conservé</p>
                )}
              </div>

              <div className="glass min-w-0 space-y-3 rounded-2xl p-4">
                <Label className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-purple-400" />
                  Cover (image)
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setTrackForm({ ...trackForm, coverFile: e.target.files[0] })}
                  className="w-full max-w-full rounded-[10px]"
                  data-testid="form-cover"
                />
                {editingTrack?.cover_url && !trackForm.coverFile && (
                  <p className="text-xs text-green-400">✓ Cover actuelle conservée</p>
                )}
              </div>
            </div>

            {/* Stepper actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-full"
                onClick={closeTrackDialog}
              >
                Annuler
              </Button>
              <div className="flex-1" />

              {trackStep > 0 && (
                <Button type="button" variant="outline" className="h-12 rounded-full" onClick={prevStep}>
                  Retour
                </Button>
              )}

              {trackStep < 3 ? (
                <Button
                  type="button"
                  className="h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0"
                  onClick={nextStep}
                  disabled={!canGoNext()}
                >
                  Continuer
                </Button>
              ) : (
                <Button
                  type="button"
                  className="h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                  disabled={submitting}
                  onClick={handleSubmit}
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
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Album Dialog */}
      <Dialog open={showAlbumDialog} onOpenChange={(open) => { if (!open) closeAlbumDialog(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-heavy border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingAlbum ? 'Modifier l’album' : 'Nouvel album'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Étape {albumStep + 1}/4</span>
                <span>{albumStep === 0 ? 'Infos' : albumStep === 1 ? 'Prix' : albumStep === 2 ? 'Titres' : 'Cover & statut'}</span>
              </div>
              <Progress value={((albumStep + 1) / 4) * 100} />
            </div>

            {/* Infos */}
            <div className={`${albumStep !== 0 ? 'hidden' : ''} space-y-4`}>
              <div className="space-y-2">
                <Label>Titre *</Label>
                <Input
                  value={albumForm.title}
                  onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
                  className="h-12 rounded-[10px]"
                  required
                  data-testid="album-form-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={albumForm.description}
                  onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                  className="min-h-[88px] rounded-[10px]"
                  rows={3}
                  data-testid="album-form-description"
                />
              </div>
            </div>

            {/* Prix */}
            <div className={`${albumStep !== 1 ? 'hidden' : ''} grid grid-cols-1 md:grid-cols-2 gap-4`}>
              <div className="flex flex-col gap-2">
                <div className={priceStepLabelRow}>
                  <Label htmlFor="album-form-price">Prix (€) *</Label>
                </div>
                <Input
                  id="album-form-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={albumForm.price}
                  onChange={(e) => setAlbumForm({ ...albumForm, price: e.target.value })}
                  className="h-12 rounded-[10px]"
                  placeholder="9.99"
                  required={!albumForm.isFreePrice}
                  disabled={albumForm.isFreePrice}
                  data-testid="album-form-price"
                />
                <p className="text-xs text-muted-foreground">
                  Ou active <span className="text-purple-300 font-medium">Prix libre</span> à droite
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <div className={priceStepLabelRow}>
                  <Label className="flex items-center gap-2 font-normal cursor-pointer leading-snug">
                    <Checkbox
                      checked={albumForm.isFreePrice}
                      onCheckedChange={(v) => {
                        const next = !!v;
                        setAlbumForm({
                          ...albumForm,
                          isFreePrice: next,
                          price: next ? '0' : albumForm.price
                        });
                      }}
                      data-testid="album-form-free-price"
                    />
                    Prix libre (l’utilisateur choisit le prix)
                  </Label>
                </div>
                <Input
                  id="album-form-free-price-min"
                  type="number"
                  step="0.01"
                  min="0"
                  value={albumForm.minPrice}
                  onChange={(e) => setAlbumForm({ ...albumForm, minPrice: e.target.value })}
                  className={`h-12 rounded-[10px] ${!albumForm.isFreePrice ? 'opacity-50 pointer-events-none' : ''}`}
                  placeholder="Minimum (optionnel)"
                  aria-label="Minimum (optionnel)"
                  disabled={!albumForm.isFreePrice}
                  data-testid="album-form-free-price-min"
                />
                <p className="text-xs text-muted-foreground">Laisse vide pour “pas de minimum”.</p>
              </div>
            </div>

            {/* Tracks */}
            <div className={`${albumStep !== 2 ? 'hidden' : ''} space-y-3`}>
              <Label>Titres de l’album *</Label>
              {(albumForm.trackIds?.length || 0) > 0 ? (
                <div className="glass rounded-2xl p-4 text-sm text-muted-foreground">
                  Tracks déjà dans l’album: <span className="text-foreground font-medium">{albumForm.trackIds.length}</span>
                </div>
              ) : null}

              <div className="glass rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    Ajoute un ou plusieurs tracks à cet album (titre + description, et les champs requis).
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      const next = [
                        ...(albumForm.albumTracks || []),
                        {
                          title: '',
                          description: '',
                          genre: '',
                          price: albumForm.price || '0',
                          isFreePrice: albumForm.isFreePrice || false,
                          minPrice: albumForm.minPrice || '',
                          status: 'draft',
                          audioFile: null,
                          coverFile: null
                        }
                      ];
                      setAlbumForm({ ...albumForm, albumTracks: next });
                    }}
                    data-testid="album-add-track"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un track
                  </Button>
                </div>

                {(albumForm.albumTracks || []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Aucun track ajouté. Clique sur “Ajouter un track”.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(albumForm.albumTracks || []).map((t, idx) => (
                      <div key={idx} className="glass rounded-2xl p-4 space-y-4 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">Track #{idx + 1}</div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-red-500/10 hover:text-red-400"
                            onClick={() => {
                              const next = (albumForm.albumTracks || []).filter((_, i) => i !== idx);
                              setAlbumForm({ ...albumForm, albumTracks: next });
                            }}
                            data-testid={`album-remove-track-${idx}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Titre *</Label>
                            <Input
                              value={t.title}
                              onChange={(e) => {
                                const next = [...(albumForm.albumTracks || [])];
                                next[idx] = { ...next[idx], title: e.target.value };
                                setAlbumForm({ ...albumForm, albumTracks: next });
                              }}
                              className="h-12 rounded-[10px]"
                              placeholder="Titre du track"
                              data-testid={`album-track-title-${idx}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Genre *</Label>
                            <Input
                              value={t.genre}
                              onChange={(e) => {
                                const next = [...(albumForm.albumTracks || [])];
                                next[idx] = { ...next[idx], genre: e.target.value };
                                setAlbumForm({ ...albumForm, albumTracks: next });
                              }}
                              className="h-12 rounded-[10px]"
                              placeholder="Hip-Hop, Electronic..."
                              data-testid={`album-track-genre-${idx}`}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={t.description}
                            onChange={(e) => {
                              const next = [...(albumForm.albumTracks || [])];
                              next[idx] = { ...next[idx], description: e.target.value };
                              setAlbumForm({ ...albumForm, albumTracks: next });
                            }}
                            className="min-h-[88px] rounded-[10px]"
                            rows={3}
                            data-testid={`album-track-description-${idx}`}
                          />
                        </div>

                        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
                          <div className="flex min-w-0 flex-col gap-2">
                            <div className={priceStepLabelRow}>
                              <Label htmlFor={`album-track-price-${idx}`}>Prix (€) *</Label>
                            </div>
                            <Input
                              id={`album-track-price-${idx}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={t.price}
                              onChange={(e) => {
                                const next = [...(albumForm.albumTracks || [])];
                                next[idx] = { ...next[idx], price: e.target.value };
                                setAlbumForm({ ...albumForm, albumTracks: next });
                              }}
                              className="h-12 rounded-[10px]"
                              placeholder="0"
                              required={!t.isFreePrice}
                              disabled={!!t.isFreePrice}
                              data-testid={`album-track-price-${idx}`}
                            />
                            <Label className="flex items-center gap-2 font-normal cursor-pointer leading-snug pt-1">
                              <Checkbox
                                checked={!!t.isFreePrice}
                                onCheckedChange={(v) => {
                                  const nextTracks = [...(albumForm.albumTracks || [])];
                                  nextTracks[idx] = { ...nextTracks[idx], isFreePrice: !!v, price: v ? '0' : nextTracks[idx].price };
                                  setAlbumForm({ ...albumForm, albumTracks: nextTracks });
                                }}
                                data-testid={`album-track-free-price-${idx}`}
                              />
                              Prix libre
                            </Label>
                            <Input
                              id={`album-track-free-price-min-${idx}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={t.minPrice || ''}
                              onChange={(e) => {
                                const next = [...(albumForm.albumTracks || [])];
                                next[idx] = { ...next[idx], minPrice: e.target.value };
                                setAlbumForm({ ...albumForm, albumTracks: next });
                              }}
                              className={`h-12 rounded-[10px] ${!t.isFreePrice ? 'opacity-50 pointer-events-none' : ''}`}
                              placeholder="Minimum (optionnel)"
                              aria-label="Minimum (optionnel)"
                              disabled={!t.isFreePrice}
                              data-testid={`album-track-free-price-min-${idx}`}
                            />
                          </div>

                          <div className="flex min-w-0 flex-col gap-2">
                            <div className={priceStepLabelRow}>
                              <Label htmlFor={`album-track-audio-${idx}`} className="flex items-center gap-2 font-normal">
                                <FileAudio className="w-4 h-4 shrink-0 text-cyan-400" />
                                Audio (optionnel)
                              </Label>
                            </div>
                            <Input
                              id={`album-track-audio-${idx}`}
                              type="file"
                              accept="audio/*"
                              onChange={(e) => {
                                const next = [...(albumForm.albumTracks || [])];
                                next[idx] = { ...next[idx], audioFile: e.target.files?.[0] || null };
                                setAlbumForm({ ...albumForm, albumTracks: next });
                              }}
                              className="w-full max-w-full rounded-[10px]"
                              data-testid={`album-track-audio-${idx}`}
                            />
                          </div>

                          <div className="flex min-w-0 flex-col gap-2">
                            <div className={priceStepLabelRow}>
                              <Label htmlFor={`album-track-cover-${idx}`} className="flex items-center gap-2 font-normal">
                                <Image className="w-4 h-4 shrink-0 text-purple-400" />
                                Cover (optionnel)
                              </Label>
                            </div>
                            <Input
                              id={`album-track-cover-${idx}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const next = [...(albumForm.albumTracks || [])];
                                next[idx] = { ...next[idx], coverFile: e.target.files?.[0] || null };
                                setAlbumForm({ ...albumForm, albumTracks: next });
                              }}
                              className="w-full max-w-full rounded-[10px]"
                              data-testid={`album-track-cover-${idx}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cover & status */}
            <div className={`${albumStep !== 3 ? 'hidden' : ''} grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2`}>
              <div className="glass min-w-0 space-y-3 rounded-2xl p-4">
                <Label className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-purple-400" />
                  Cover (image)
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAlbumForm({ ...albumForm, coverFile: e.target.files[0] })}
                  className="w-full max-w-full rounded-[10px]"
                  data-testid="album-form-cover"
                />
                {editingAlbum?.cover_url && !albumForm.coverFile && (
                  <p className="text-xs text-green-400">✓ Cover actuelle conservée</p>
                )}
              </div>
              <div className="glass rounded-2xl p-4 space-y-3">
                <Label>Statut</Label>
                <div className={fieldRing}>
                  <select
                    value={albumForm.status}
                    onChange={(e) => setAlbumForm({ ...albumForm, status: e.target.value })}
                    className={cn(
                      'h-12 w-full rounded-[10px] px-4 py-2.5 text-sm',
                      fieldInnerSurface,
                      fieldFocusRingSelect
                    )}
                  >
                    <option value="draft">Brouillon (non visible)</option>
                    <option value="published">Publié (visible par tous)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Album Meta */}
            <div className={`${albumStep !== 3 ? 'hidden' : ''} glass rounded-2xl p-4 space-y-4`}>
              <h4 className="font-semibold flex items-center gap-2">
                <Library className="w-4 h-4 text-purple-300" />
                Infos album
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Version</Label>
                  <div className={fieldRing}>
                    <select
                      value={albumForm.mixVersion}
                      onChange={(e) => setAlbumForm({ ...albumForm, mixVersion: e.target.value })}
                      className={cn(
                        'h-12 w-full rounded-[10px] px-4 py-2.5 text-sm',
                        fieldInnerSurface,
                        fieldFocusRingSelect
                      )}
                    >
                      <option value="">—</option>
                      <option value="maquette">Maquette</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Disponibilité</Label>
                  <div className={fieldRing}>
                    <select
                      value={albumForm.availability}
                      onChange={(e) => setAlbumForm({ ...albumForm, availability: e.target.value })}
                      className={cn(
                        'h-12 w-full rounded-[10px] px-4 py-2.5 text-sm',
                        fieldInnerSurface,
                        fieldFocusRingSelect
                      )}
                    >
                      <option value="">—</option>
                      <option value="exclusive">Kloud Exclusive Only</option>
                      <option value="all_platforms">Dispo sur toutes les plateformes</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Producteur</Label>
                  <Input
                    value={albumForm.producer}
                    onChange={(e) => setAlbumForm({ ...albumForm, producer: e.target.value })}
                    className="h-12 rounded-[10px]"
                    placeholder="Nom du producteur"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Beatmaker</Label>
                  <Input
                    value={albumForm.beatmaker}
                    onChange={(e) => setAlbumForm({ ...albumForm, beatmaker: e.target.value })}
                    className="h-12 rounded-[10px]"
                    placeholder="Nom du beatmaker"
                  />
                </div>
              </div>
            </div>

            {/* Stepper actions */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="h-12 rounded-full" onClick={closeAlbumDialog}>
                Annuler
              </Button>
              <div className="flex-1" />

              {albumStep > 0 && (
                <Button type="button" variant="outline" className="h-12 rounded-full" onClick={prevAlbumStep}>
                  Retour
                </Button>
              )}

              {albumStep < 3 ? (
                <Button
                  type="button"
                  className="h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 border-0"
                  onClick={nextAlbumStep}
                  disabled={!canGoNextAlbum()}
                >
                  Continuer
                </Button>
              ) : (
                <Button
                  type="button"
                  className="h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                  disabled={submitting}
                  onClick={handleSubmitAlbum}
                  data-testid="album-form-submit"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingAlbum ? 'Modification...' : 'Ajout...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingAlbum ? 'Enregistrer' : 'Ajouter l’album'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArtistDashboard;
