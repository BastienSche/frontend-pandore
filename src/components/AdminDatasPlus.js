import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Clock,
  Heart,
  Loader2,
  MapPin,
  Radio,
  ShoppingBag,
  Users
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { apiClient, formatApiError } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#fb923c', '#60a5fa', '#facc15', '#c084fc'];

const tooltipStyle = {
  background: 'rgba(8, 12, 24, 0.95)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  fontSize: 12
};

const formatDuration = (sec) => {
  const n = Math.max(0, Number(sec) || 0);
  if (n < 60) return `${Math.round(n)} s`;
  const m = Math.floor(n / 60);
  const s = Math.round(n % 60);
  if (m < 60) return s ? `${m} min ${s} s` : `${m} min`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h} h ${rm} min` : `${h} h`;
};

const formatWhen = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
};

const Kpi = ({ label, value, hint, icon: Icon, color = 'cyan' }) => {
  const tones = {
    cyan: 'from-cyan-500/20 to-blue-500/10 text-cyan-300',
    pink: 'from-pink-500/20 to-purple-500/10 text-pink-300',
    green: 'from-emerald-500/20 to-cyan-500/10 text-emerald-300',
    orange: 'from-orange-500/20 to-pink-500/10 text-orange-300',
    purple: 'from-purple-500/20 to-cyan-500/10 text-purple-300'
  };
  return (
    <div className={`rounded-3xl border border-white/10 bg-gradient-to-br ${tones[color]} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon ? <Icon className="w-4 h-4 opacity-80" /> : null}
      </div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
    </div>
  );
};

const Panel = ({ title, subtitle, children, className = '' }) => (
  <div className={`glass-heavy rounded-3xl p-5 border border-white/10 ${className}`}>
    <div className="mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle ? <p className="text-xs text-muted-foreground mt-1">{subtitle}</p> : null}
    </div>
    {children}
  </div>
);

const AdminDatasPlus = ({ active }) => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    const load = async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const { data: next } = await apiClient.get('/api/admin/analytics', { params: { days } });
        if (!cancelled) {
          setData(next);
          setError('');
        }
      } catch (e) {
        if (!cancelled) setError(formatApiError(e, 'Impossible de charger les datas'));
      } finally {
        if (!cancelled && !silent) setLoading(false);
      }
    };
    load(false);
    const t = window.setInterval(() => load(true), 25000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [active, days]);

  const daily = data?.daily || [];
  const hasDailySignal = daily.some(
    (d) => d.plays || d.likes || d.follows || d.purchases || d.visitors || d.signups
  );
  const funnelMax = Math.max(1, ...(data?.funnel || []).map((f) => Number(f.n) || 0));
  const live = data?.live || {};
  const retention = data?.retention || {};
  const engagement = data?.engagement || {};

  const hourChart = useMemo(
    () => (data?.hours || []).map((h) => ({ ...h, visits: Number(h.visits) || 0 })),
    [data]
  );

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Chargement des datas…
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-datas-plus">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Datas +</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Stats internes de tout Kloud — live, temps passé, zones, rétention d’achat. Réservé admin / dev.
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((n) => (
            <Button
              key={n}
              size="sm"
              variant={days === n ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setDays(n)}
            >
              {n} j
            </Button>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          label="En direct"
          value={live.visitors ?? 0}
          hint={`${live.logged_in || 0} connectés · ${live.guests || 0} invités`}
          icon={Radio}
          color="green"
        />
        <Kpi
          label="Temps moyen"
          value={formatDuration(engagement.avg_session_sec)}
          hint={`Médiane ${formatDuration(engagement.median_session_sec)}`}
          icon={Clock}
          color="cyan"
        />
        <Kpi
          label="Comptes"
          value={data?.accounts?.users ?? 0}
          hint={`${data?.accounts?.artists || 0} artistes · ${data?.accounts?.admins || 0} admin`}
          icon={Users}
          color="orange"
        />
        <Kpi
          label="Rétention achat"
          value={`${retention.signup_to_buy_pct ?? retention.play_to_buy_pct ?? 0}%`}
          hint={`${retention.unique_buyers || 0} acheteurs / ${data?.accounts?.users || 0} comptes`}
          icon={ShoppingBag}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel
          className="lg:col-span-2"
          title="Personnes connectées maintenant"
          subtitle="Tout le site — rafraîchi toutes les 25 s."
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
            </span>
            <span className="text-sm">
              <strong>{live.visitors ?? 0}</strong> en ligne
            </span>
            <Badge variant="secondary" className="bg-white/10 border-white/10">
              {live.logged_in || 0} comptes
            </Badge>
          </div>
          <div className="h-52">
            {(live.by_path || []).length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={live.by_path} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#34d399" radius={[0, 8, 8, 0]} name="Visiteurs" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Personne en direct sur le site pour l’instant.</p>
            )}
          </div>
        </Panel>
        <Panel title="Où" subtitle="Pays / fuseau des sessions récentes.">
          <div className="h-52">
            {(data?.regions || []).length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.regions} dataKey="value" nameKey="name" innerRadius={42} outerRadius={72} paddingAngle={3}>
                    {(data.regions || []).map((_, i) => (
                      <Cell key={`r-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Les zones s’affichent dès les premières visites trackées.</p>
            )}
          </div>
        </Panel>
      </div>

      <Panel
        title="Activité quotidienne"
        subtitle={`Écoutes, likes, follows, achats et inscriptions sur ${days} jours.`}
      >
        <div className="h-72">
          {hasDailySignal ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="plays" name="Écoutes" stroke="#22d3ee" fill="#22d3ee33" />
                <Area type="monotone" dataKey="likes" name="Likes" stroke="#f472b6" fill="#f472b633" />
                <Area type="monotone" dataKey="follows" name="Follows" stroke="#a78bfa" fill="#a78bfa33" />
                <Area type="monotone" dataKey="purchases" name="Achats" stroke="#34d399" fill="#34d39933" />
                <Area type="monotone" dataKey="signups" name="Inscriptions" stroke="#fb923c" fill="#fb923c33" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-16 text-center">Pas encore d’activité sur cette période.</p>
          )}
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Périodes d’activité" subtitle="Heure locale des visites (0–23 h).">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourChart}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={2} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="visits" name="Visites" fill="#60a5fa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Jours de la semaine" subtitle="Écoutes par jour (UTC).">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weekdays || []}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="plays" name="Écoutes" fill="#c084fc" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Funnel & rétention" subtitle="Chemin site entier : compte → écoute → like → follow → achat.">
          <div className="space-y-3">
            {(data?.funnel || []).map((step) => (
              <div key={step.step}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{step.step}</span>
                  <span className="tabular-nums text-muted-foreground">{step.n}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
                    style={{ width: `${Math.max(4, (Number(step.n) / funnelMax) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
            <div className="rounded-2xl bg-white/5 p-3">
              <p className="text-muted-foreground">Like après écoute</p>
              <p className="text-xl font-semibold">{retention.play_to_like_pct ?? 0}%</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-3">
              <p className="text-muted-foreground">Achat après like</p>
              <p className="text-xl font-semibold">{retention.like_to_buy_pct ?? 0}%</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-3">
              <p className="text-muted-foreground">Acheteurs récurrents</p>
              <p className="text-xl font-semibold">{retention.repeat_buyer_pct ?? 0}%</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-3">
              <p className="text-muted-foreground">Délai moyen achat</p>
              <p className="text-xl font-semibold">
                {retention.avg_days_to_purchase != null ? `${retention.avg_days_to_purchase} j` : '—'}
              </p>
            </div>
          </div>
        </Panel>
        <Panel title="Répartition des titres" subtitle="Top écoutes sur la période complète enregistrée.">
          <div className="h-64">
            {(data?.top_tracks || []).length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.top_tracks} dataKey="plays" nameKey="title" innerRadius={48} outerRadius={80}>
                    {(data.top_tracks || []).map((_, i) => (
                      <Cell key={`t-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Pas encore d’écoutes à afficher.</p>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Écoutes" value={data?.totals?.plays ?? 0} hint={`${retention.guest_plays || 0} sans compte`} icon={Activity} />
        <Kpi label="Likes" value={data?.totals?.likes ?? 0} icon={Heart} color="pink" />
        <Kpi label="Sessions" value={engagement.sessions ?? 0} hint={`${engagement.guest_sessions || 0} invités`} icon={Users} color="orange" />
        <Kpi
          label="CA période"
          value={`${((data?.totals?.revenue_cents || 0) / 100).toFixed(2)} €`}
          hint={`${data?.totals?.purchases || 0} achats`}
          icon={ShoppingBag}
          color="green"
        />
      </div>

      <Panel title="Dernières connexions" subtitle="Quand, où, combien de temps, sur quelle page.">
        {(data?.recent_visitors || []).length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-white/10">
                  <th className="pb-3">Quand</th>
                  <th className="pb-3">Où</th>
                  <th className="pb-3">Page</th>
                  <th className="pb-3 text-right">Temps</th>
                    <th className="pb-3 text-right">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(data.recent_visitors || []).map((row, idx) => (
                  <tr key={`${row.when}-${idx}`}>
                    <td className="py-2.5">{formatWhen(row.when)}</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        {row.region || '—'}
                      </span>
                    </td>
                    <td className="py-2.5 truncate max-w-[220px] text-muted-foreground">{row.path}</td>
                    <td className="py-2.5 text-right tabular-nums">{formatDuration(row.dwell_sec)}</td>
                    <td className="py-2.5 text-right font-mono text-xs">
                      {row.logged_in ? row.user_id || 'Oui' : 'Invité'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Les visites du site alimentent ce journal (heure, zone, durée, compte).
          </p>
        )}
      </Panel>
    </div>
  );
};

export default AdminDatasPlus;
