import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Activity, CreditCard, Download, Loader2, Pencil, Search, Shield, Trash2, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, formatApiError } from '@/lib/apiClient';

const nf = new Intl.NumberFormat('fr-FR');
const eur = (cents) => {
  const n = Number(cents) || 0;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n / 100);
};

const isAdmin = (user) => String(user?.role || '').toUpperCase() === 'ADMIN';

const MiniBarChart = ({ series, valueKey, height = 90 }) => {
  if (!Array.isArray(series) || series.length === 0) {
    return (
      <div className="w-full">
        <div
          className="rounded-3xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-xs text-muted-foreground"
          style={{ height }}
        >
          Pas de données (encore)
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground/80">30 derniers jours</div>
      </div>
    );
  }
  const values = series.map((d) => Number(d?.[valueKey]) || 0);
  const max = Math.max(1, ...values);
  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto">
        <div className="flex items-end gap-1 pr-2 min-w-max" style={{ height }}>
        {series.map((d) => {
          const v = Number(d?.[valueKey]) || 0;
          const h = Math.max(2, Math.round((v / max) * height));
          return (
            <div
              key={`${d.day}-${valueKey}`}
              className="w-2.5 rounded-sm bg-gradient-to-t from-cyan-500/35 to-purple-500/35 border border-white/10"
              style={{ height: h }}
              title={`${d.day}: ${v}`}
            />
          );
        })}
        </div>
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground/80">
        30 derniers jours (données issues des transactions payées)
      </div>
    </div>
  );
};

const StatCard = ({ Icon, title, value, subtitle, gradient = 'from-cyan-400 to-purple-400' }) => (
  <div className="glass-heavy rounded-[28px] p-7 border border-white/10 shadow-[0_14px_55px_rgba(0,0,0,0.18)]">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className={`mt-2 text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${gradient}`}>
          {value}
        </div>
        {subtitle && <div className="mt-1 text-xs text-muted-foreground/80">{subtitle}</div>}
      </div>
      <div className={`shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} opacity-90 flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-zinc-900/90 dark:text-black/80" />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState(null);
  const [txns, setTxns] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [q, setQ] = useState('');
  const lastFetchRef = useRef(0);

  const canView = isAuthenticated && isAdmin(user);

  useEffect(() => {
    if (!canView) return;
    let cancelled = false;

    const fetchAdmin = async () => {
      setLoading(true);
      setError('');
      try {
        const [ov, pt, lg, tr, al] = await Promise.all([
          apiClient.get('/api/admin/overview'),
          apiClient.get('/api/admin/payment-transactions?limit=200'),
          apiClient.get('/api/admin/logs?limit=200'),
          apiClient.get('/api/admin/tracks?limit=300'),
          apiClient.get('/api/admin/albums?limit=300')
        ]);
        if (cancelled) return;
        setOverview(ov.data);
        setTxns(pt.data?.items || []);
        setLogs(lg.data?.items || []);
        setTracks(tr.data?.items || []);
        setAlbums(al.data?.items || []);
      } catch (e) {
        if (!cancelled) setError(formatApiError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAdmin();
    return () => {
      cancelled = true;
    };
  }, [canView]);

  const series = useMemo(() => overview?.series_30d || [], [overview]);
  const counts = overview?.counts || {};
  const money = overview?.money || {};

  const filteredTracks = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return tracks;
    return tracks.filter((t) => {
      const hay = `${t?.track_id || ''} ${t?.title || ''} ${t?.artist_name || ''} ${t?.status || ''}`.toLowerCase();
      return hay.includes(s);
    });
  }, [tracks, q]);

  const filteredAlbums = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return albums;
    return albums.filter((a) => {
      const hay = `${a?.album_id || ''} ${a?.title || ''} ${a?.artist_name || ''} ${a?.status || ''}`.toLowerCase();
      return hay.includes(s);
    });
  }, [albums, q]);

  const exportCsv = async (kind) => {
    const now = Date.now();
    if (now - lastFetchRef.current < 800) return;
    lastFetchRef.current = now;
    const path = kind === 'tracks' ? '/api/admin/tracks.csv' : '/api/admin/albums.csv';
    const resp = await apiClient.get(path, { responseType: 'text' });
    const blob = new Blob([resp.data], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kloud-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const patchTrack = async (trackId, patch) => {
    const resp = await apiClient.patch(`/api/admin/tracks/${trackId}`, patch);
    setTracks((prev) => prev.map((t) => (t.track_id === trackId ? resp.data : t)));
  };

  const deleteTrack = async (trackId) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Supprimer le track ${trackId} ?`)) return;
    await apiClient.delete(`/api/admin/tracks/${trackId}`);
    setTracks((prev) => prev.filter((t) => t.track_id !== trackId));
  };

  const patchAlbum = async (albumId, patch) => {
    const resp = await apiClient.patch(`/api/admin/albums/${albumId}`, patch);
    setAlbums((prev) => prev.map((a) => (a.album_id === albumId ? resp.data : a)));
  };

  const deleteAlbum = async (albumId) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Supprimer l’album ${albumId} ?`)) return;
    await apiClient.delete(`/api/admin/albums/${albumId}`);
    setAlbums((prev) => prev.filter((a) => a.album_id !== albumId));
  };

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin(user)) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden">
      <BubbleBackground />
      <GlowOrb color="cyan" size={720} x="8%" y="18%" blur={180} />
      <GlowOrb color="purple" size={680} x="92%" y="62%" blur={180} />
      <GlowOrb color="pink" size={560} x="55%" y="92%" blur={160} />

      <div className="relative pt-28 pb-10 px-6 md:px-12">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-white/5 border border-white/10 text-foreground/90 rounded-full px-4 py-1.5 backdrop-blur-md">
                <Shield className="w-4 h-4 mr-2 inline" />
                Admin (fondateur)
              </Badge>
              <Badge className="bg-white/5 border border-white/10 text-foreground/90 rounded-full px-4 py-1.5 backdrop-blur-md">
                Accès privé — rôle `ADMIN`
              </Badge>
            </div>

            <div className="mt-7 flex items-end justify-between gap-6 flex-col md:flex-row">
              <div className="min-w-0">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[0.95]">
                  Dashboard
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
                    Kloud Admin
                  </span>
                </h1>
                <p className="mt-4 text-muted-foreground max-w-3xl leading-relaxed">
                  Vue interne: contenus, transactions, fees plateforme et logs. Rien n’est exposé au public.
                </p>
              </div>
              <div className="flex gap-3">
                <Button className="rounded-full" variant="outline" onClick={() => window.location.reload()}>
                  Rafraîchir
                </Button>
              </div>
            </div>

            <div className="mt-7 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { id: 'overview', label: 'Aperçu' },
                  { id: 'tracks', label: 'Tracks' },
                  { id: 'albums', label: 'Albums' },
                  { id: 'transactions', label: 'Transactions' },
                  { id: 'logs', label: 'Logs' }
                ].map((t) => (
                  <Button
                    key={t.id}
                    variant={activeTab === t.id ? 'secondary' : 'ghost'}
                    className="rounded-full"
                    onClick={() => setActiveTab(t.id)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>

              {(activeTab === 'tracks' || activeTab === 'albums') && (
                <div className="flex items-center gap-2 w-full lg:w-auto">
                  <div className="flex items-center gap-2 glass-heavy border border-white/10 rounded-full px-4 py-2 w-full lg:w-[420px]">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Rechercher (id, titre, artiste, statut)…"
                      className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => exportCsv(activeTab)}
                    title="Exporter CSV"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {loading ? (
          <div className="glass-heavy rounded-[32px] p-10 border border-white/10 flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Chargement…
          </div>
        ) : error ? (
          <div className="glass-heavy rounded-[32px] p-10 border border-white/10">
            <div className="text-lg font-semibold">Erreur admin</div>
            <div className="mt-2 text-muted-foreground">{error}</div>
            <div className="mt-6 text-sm text-muted-foreground/80">
              Cette page appelle `GET /api/admin/*` et nécessite un compte avec `role=ADMIN` en base.
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    Icon={Users}
                    title="Utilisateurs"
                    value={nf.format(Number(counts.users || 0))}
                    subtitle={`Artistes: ${nf.format(Number(counts.artists || 0))}`}
                  />
                  <StatCard
                    Icon={Activity}
                    title="Contenus"
                    value={`${nf.format(Number(counts.tracks || 0))} tracks`}
                    subtitle={`${nf.format(Number(counts.albums || 0))} albums`}
                    gradient="from-purple-400 to-pink-400"
                  />
                  <StatCard
                    Icon={CreditCard}
                    title="Transactions"
                    value={nf.format(Number(counts.payment_transactions || 0))}
                    subtitle={`Payées: ${nf.format(Number(counts.paid_transactions || 0))}`}
                    gradient="from-pink-400 to-cyan-400"
                  />
                </div>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 glass-heavy rounded-[32px] p-8 border border-white/10 shadow-[0_16px_60px_rgba(0,0,0,0.18)]">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Chiffre (30j)</div>
                        <div className="mt-2 text-2xl font-semibold tracking-tight">Volume brut & fees plateforme</div>
                      </div>
                      <Badge className="bg-white/5 border border-white/10 text-foreground/90 rounded-full px-4 py-1.5">
                        Fee: {Number(money.platform_fee_percent || 0)}%
                      </Badge>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm text-muted-foreground">Brut</div>
                        <div className="mt-2 text-3xl font-bold">{eur(money.gross_cents)}</div>
                        <div className="mt-4">
                          <MiniBarChart series={series} valueKey="gross_cents" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Fees Kloud</div>
                        <div className="mt-2 text-3xl font-bold">{eur(money.platform_fees_cents)}</div>
                        <div className="mt-4">
                          <MiniBarChart series={series} valueKey="fee_cents" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 text-xs text-muted-foreground/80">
                      Notes: les fees sont calculées depuis `payment_transactions.platform_fee_cents` quand Stripe Connect est utilisé.
                    </div>
                  </div>

                  <div className="glass-heavy rounded-[32px] p-8 border border-white/10 shadow-[0_16px_60px_rgba(0,0,0,0.18)]">
                    <div className="text-sm text-muted-foreground">Synthèse</div>
                    <div className="mt-2 text-2xl font-semibold tracking-tight">Revenus & net vendeur</div>
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Brut</div>
                        <div className="font-semibold">{eur(money.gross_cents)}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Fees Kloud</div>
                        <div className="font-semibold">{eur(money.platform_fees_cents)}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Net vendeur (estim.)</div>
                        <div className="font-semibold">{eur(money.seller_net_cents)}</div>
                      </div>
                      <div className="pt-4 border-t border-white/10 text-xs text-muted-foreground/80">
                        Currency: {String(money.currency || 'eur').toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Historique (reste dans l’aperçu) */}
                <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="glass-heavy rounded-[32px] p-8 border border-white/10 shadow-[0_16px_60px_rgba(0,0,0,0.18)]">
                    <div className="flex items-end justify-between gap-4">
                      <div className="text-2xl font-semibold tracking-tight">Transactions récentes</div>
                      <Button variant="ghost" className="rounded-full" onClick={() => setActiveTab('transactions')}>
                        Voir tout
                      </Button>
                    </div>
                    <div className="mt-4 max-h-[420px] overflow-auto rounded-2xl border border-white/10">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {txns.slice(0, 50).map((t) => (
                            <TableRow key={t.transaction_id || t.session_id}>
                              <TableCell className="text-muted-foreground">
                                {String(t.created_at || '').slice(0, 19).replace('T', ' ')}
                              </TableCell>
                              <TableCell className="font-medium">{t?.metadata?.item_type || '—'}</TableCell>
                              <TableCell className="text-muted-foreground">{t.payment_status || t.status || '—'}</TableCell>
                              <TableCell className="text-right font-semibold">{eur(t.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="glass-heavy rounded-[32px] p-8 border border-white/10 shadow-[0_16px_60px_rgba(0,0,0,0.18)]">
                    <div className="flex items-end justify-between gap-4">
                      <div className="text-2xl font-semibold tracking-tight">Logs récents</div>
                      <Button variant="ghost" className="rounded-full" onClick={() => setActiveTab('logs')}>
                        Voir tout
                      </Button>
                    </div>
                    <div className="mt-4 max-h-[420px] overflow-auto rounded-2xl border border-white/10">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Kind</TableHead>
                            <TableHead>Détails</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logs.slice(0, 50).map((e) => (
                            <TableRow key={e.event_id || `${e.kind}-${e.created_at}`}>
                              <TableCell className="text-muted-foreground">
                                {String(e.created_at || '').slice(0, 19).replace('T', ' ')}
                              </TableCell>
                              <TableCell className="font-medium">{e.kind || '—'}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {(() => {
                                  const d = e.data || {};
                                  const keys = Object.keys(d).slice(0, 8);
                                  return keys.length ? keys.map((k) => `${k}=${String(d[k]).slice(0, 28)}`).join(' • ') : '—';
                                })()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground/80">Source: collection `transactions`.</div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'tracks' && (
              <div className="glass-heavy rounded-[32px] p-8 border border-white/10 shadow-[0_16px_60px_rgba(0,0,0,0.18)]">
                <div className="text-2xl font-semibold tracking-tight">Tracks ({filteredTracks.length})</div>
                <div className="mt-4 max-h-[560px] overflow-auto rounded-2xl border border-white/10">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Titre</TableHead>
                        <TableHead>Artiste</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Prix (cents)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTracks.slice(0, 500).map((t) => (
                        <TableRow key={t.track_id}>
                          <TableCell className="font-medium">{t.track_id}</TableCell>
                          <TableCell>{t.title || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{t.artist_name || t.artist_id || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{t.status || '—'}</TableCell>
                          <TableCell className="text-right">{nf.format(Number(t.price || 0))}</TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => {
                                  const next = (t.status || '').toLowerCase() === 'published' ? 'draft' : 'published';
                                  patchTrack(t.track_id, { status: next });
                                }}
                              >
                                {(t.status || '').toLowerCase() === 'published' ? 'Unpublish' : 'Publish'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => {
                                  // eslint-disable-next-line no-alert
                                  const raw = window.prompt('Nouveau prix (en cents)', String(t.price ?? ''));
                                  if (raw == null) return;
                                  const v = Number(raw);
                                  if (!Number.isFinite(v) || v < 0) return;
                                  patchTrack(t.track_id, { price: v });
                                }}
                                title="Changer prix"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => deleteTrack(t.track_id)}
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 text-xs text-muted-foreground/80">
                  Actions admin: publish/unpublish, modifier le prix, supprimer.
                </div>
              </div>
            )}

            {activeTab === 'albums' && (
              <div className="glass-heavy rounded-[32px] p-8 border border-white/10 shadow-[0_16px_60px_rgba(0,0,0,0.18)]">
                <div className="text-2xl font-semibold tracking-tight">Albums ({filteredAlbums.length})</div>
                <div className="mt-4 max-h-[560px] overflow-auto rounded-2xl border border-white/10">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Titre</TableHead>
                        <TableHead>Artiste</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Prix (cents)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlbums.slice(0, 500).map((a) => (
                        <TableRow key={a.album_id}>
                          <TableCell className="font-medium">{a.album_id}</TableCell>
                          <TableCell>{a.title || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{a.artist_name || a.artist_id || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{a.status || '—'}</TableCell>
                          <TableCell className="text-right">{nf.format(Number(a.price || 0))}</TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => {
                                  const next = (a.status || '').toLowerCase() === 'published' ? 'draft' : 'published';
                                  patchAlbum(a.album_id, { status: next });
                                }}
                              >
                                {(a.status || '').toLowerCase() === 'published' ? 'Unpublish' : 'Publish'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => {
                                  // eslint-disable-next-line no-alert
                                  const raw = window.prompt('Nouveau prix (en cents)', String(a.price ?? ''));
                                  if (raw == null) return;
                                  const v = Number(raw);
                                  if (!Number.isFinite(v) || v < 0) return;
                                  patchAlbum(a.album_id, { price: v });
                                }}
                                title="Changer prix"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => deleteAlbum(a.album_id)}
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 text-xs text-muted-foreground/80">
                  Actions admin: publish/unpublish, modifier le prix, supprimer.
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="glass-heavy rounded-[32px] p-8 border border-white/10 shadow-[0_16px_60px_rgba(0,0,0,0.18)]">
                <div className="text-2xl font-semibold tracking-tight">Transactions (200 dernières)</div>
                <div className="mt-4 max-h-[560px] overflow-auto rounded-2xl border border-white/10">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {txns.slice(0, 200).map((t) => (
                        <TableRow key={t.transaction_id || t.session_id}>
                          <TableCell className="text-muted-foreground">
                            {String(t.created_at || '').slice(0, 19).replace('T', ' ')}
                          </TableCell>
                          <TableCell className="font-medium">{t?.metadata?.item_type || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{t.payment_status || t.status || '—'}</TableCell>
                          <TableCell className="text-right font-semibold">{eur(t.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="glass-heavy rounded-[32px] p-8 border border-white/10 shadow-[0_16px_60px_rgba(0,0,0,0.18)]">
                <div className="text-2xl font-semibold tracking-tight">Logs (200 derniers)</div>
                <div className="mt-4 max-h-[560px] overflow-auto rounded-2xl border border-white/10">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Kind</TableHead>
                        <TableHead>Détails</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.slice(0, 200).map((e) => (
                        <TableRow key={e.event_id || `${e.kind}-${e.created_at}`}>
                          <TableCell className="text-muted-foreground">
                            {String(e.created_at || '').slice(0, 19).replace('T', ' ')}
                          </TableCell>
                          <TableCell className="font-medium">{e.kind || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {(() => {
                              const d = e.data || {};
                              const keys = Object.keys(d).slice(0, 10);
                              return keys.length ? keys.map((k) => `${k}=${String(d[k]).slice(0, 28)}`).join(' • ') : '—';
                            })()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 text-xs text-muted-foreground/80">
                  Les logs viennent de la collection `transactions` (événements internes).
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

