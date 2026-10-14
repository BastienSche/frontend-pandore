import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { resolveApiUrl } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

const LINE_COLORS = [
  { stroke: '#22d3ee', glow: 'rgba(34,211,238,0.55)', rankBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30' },
  { stroke: '#e879f9', glow: 'rgba(232,121,249,0.5)', rankBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/30' },
  { stroke: '#a78bfa', glow: 'rgba(167,139,250,0.5)', rankBg: 'bg-violet-500/20 text-violet-300 border-violet-400/30' },
];

const eur = (cents) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format((Number(cents) || 0) / 100);

const dayLabel = (iso) => {
  try {
    const d = new Date(`${iso}T12:00:00Z`);
    return d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
  } catch {
    return iso?.slice(5) || '';
  }
};

const buildSmoothPath = (pts) => {
  if (!pts.length) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
};

/**
 * Widget « course » : courbes + avatars + top 3.
 * @param {{ contest: object, leaderboard: array, series: array, days?: array, compact?: boolean, className?: string }} props
 */
const RevenueRaceWidget = ({
  contest,
  leaderboard = [],
  series = [],
  days = [],
  compact = false,
  className,
}) => {
  const top = (leaderboard || []).slice(0, 3);
  const chartDays = useMemo(() => {
    const fromSeries = series?.[0]?.points?.map((p) => p.day) || [];
    const raw = (days?.length ? days : fromSeries).filter(Boolean);
    if (raw.length <= 8) return raw;
    // subsample for readability
    const step = Math.ceil(raw.length / 7);
    const sampled = raw.filter((_, i) => i % step === 0 || i === raw.length - 1);
    return sampled.slice(0, 8);
  }, [days, series]);

  const chart = useMemo(() => {
    const W = 520;
    const H = compact ? 168 : 210;
    const pad = { l: 44, r: 56, t: 18, b: 28 };
    const innerW = W - pad.l - pad.r;
    const innerH = H - pad.t - pad.b;

    const maxY = Math.max(
      1000,
      ...series.flatMap((s) => (s.points || []).map((p) => Number(p.revenue_cents) || 0)),
      ...top.map((t) => Number(t.revenue_cents) || 0)
    );
    const niceMax = Math.ceil(maxY / 2500) * 2500 || 10000;
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(niceMax * r));

    const xFor = (i, n) => pad.l + (n <= 1 ? innerW : (i / (n - 1)) * innerW);
    const yFor = (cents) => pad.t + innerH - (Math.min(cents, niceMax) / niceMax) * innerH;

    const lines = series.slice(0, 3).map((s, idx) => {
      const byDay = Object.fromEntries((s.points || []).map((p) => [p.day, p.revenue_cents]));
      const pts = chartDays.map((day, i) => ({
        x: xFor(i, chartDays.length),
        y: yFor(Number(byDay[day] ?? s.points?.[s.points.length - 1]?.revenue_cents) || 0),
        day,
      }));
      // ensure last point matches current total
      if (pts.length) {
        const last = top.find((t) => t.artist_id === s.artist_id);
        if (last) pts[pts.length - 1].y = yFor(Number(last.revenue_cents) || 0);
      }
      return {
        ...s,
        color: LINE_COLORS[idx] || LINE_COLORS[2],
        path: buildSmoothPath(pts),
        end: pts[pts.length - 1] || null,
      };
    });

    return { W, H, pad, innerH, niceMax, yTicks, lines, xFor };
  }, [series, chartDays, top, compact]);

  const phase = contest?.phase || 'live';
  const contestId = contest?.contest_id;

  if (!contest) return null;

  return (
    <div
      className={cn(
        'glass-heavy rounded-[28px] border border-white/10 shadow-[0_16px_60px_rgba(0,0,0,0.28)] overflow-hidden',
        className
      )}
      data-testid="revenue-race-widget"
    >
      <div className={cn('p-5 md:p-6', compact && 'p-4')}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0" />
              <h3 className="font-bold tracking-tight text-sm md:text-base uppercase">
                {contest.title || 'Course aux revenus'}
              </h3>
              {phase === 'live' && (
                <Badge className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-gradient-to-r from-fuchsia-500 to-violet-500 border-0 text-white">
                  Live
                </Badge>
              )}
              {phase === 'upcoming' && (
                <Badge className="rounded-full px-2.5 py-0.5 text-[10px] bg-white/10 border-white/15">
                  Bientôt
                </Badge>
              )}
              {phase === 'ended' && (
                <Badge className="rounded-full px-2.5 py-0.5 text-[10px] bg-white/10 border-white/15">
                  Terminé
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {contest.subtitle || 'Les artistes qui génèrent le plus d’euros'}
            </p>
          </div>
        </div>

        {/* Race curves */}
        <div className="mt-4 relative rounded-2xl border border-white/5 bg-black/20 overflow-hidden">
          <svg
            viewBox={`0 0 ${chart.W} ${chart.H}`}
            className="w-full h-auto"
            role="img"
            aria-label="Classement course aux revenus"
          >
            {chart.yTicks.map((tick) => {
              const y =
                chart.pad.t +
                chart.innerH -
                (tick / chart.niceMax) * chart.innerH;
              return (
                <g key={tick}>
                  <line
                    x1={chart.pad.l}
                    x2={chart.W - chart.pad.r}
                    y1={y}
                    y2={y}
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="4 6"
                  />
                  <text
                    x={chart.pad.l - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="rgba(255,255,255,0.35)"
                    fontSize="10"
                  >
                    {tick === 0 ? '0€' : `${Math.round(tick / 100)}€`}
                  </text>
                </g>
              );
            })}

            {chartDays.map((day, i) => (
              <text
                key={day}
                x={chart.xFor(i, chartDays.length)}
                y={chart.H - 8}
                textAnchor="middle"
                fill="rgba(255,255,255,0.4)"
                fontSize="10"
              >
                {dayLabel(day)}
              </text>
            ))}

            {chart.lines.map((line) => (
              <g key={line.artist_id}>
                <path
                  d={line.path}
                  fill="none"
                  stroke={line.color.stroke}
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 6px ${line.color.glow})` }}
                />
              </g>
            ))}
          </svg>

          {/* Avatars overlaid at curve ends */}
          <div className="pointer-events-none absolute inset-0">
            {chart.lines.map((line) => {
              if (!line.end) return null;
              const left = `${(line.end.x / chart.W) * 100}%`;
              const top = `${(line.end.y / chart.H) * 100}%`;
              return (
                <div
                  key={`av-${line.artist_id}`}
                  className="absolute flex items-center gap-1.5 -translate-x-1/2 -translate-y-1/2"
                  style={{ left, top }}
                >
                  <Avatar
                    className="w-8 h-8 border-2 shadow-lg"
                    style={{ borderColor: line.color.stroke, boxShadow: `0 0 12px ${line.color.glow}` }}
                  >
                    <AvatarImage src={resolveApiUrl(line.picture)} />
                    <AvatarFallback className="text-[10px] bg-white/10">
                      {(line.artist_name || '?')[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded-full border backdrop-blur-md',
                      line.color.rankBg
                    )}
                  >
                    #{line.rank}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaderboard rows */}
        <div className="mt-4 space-y-2.5">
          {top.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-muted-foreground">
              Pas encore de ventes sur cette période — la course démarre dès le premier euro.
            </div>
          ) : (
            top.map((row, idx) => {
              const color = LINE_COLORS[idx] || LINE_COLORS[2];
              const max = Number(top[0]?.revenue_cents) || 1;
              const pct = Math.max(8, Math.round((Number(row.revenue_cents) / max) * 100));
              return (
                <Link
                  key={row.artist_id}
                  to={`/artist/${row.artist_id}`}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors hover:bg-white/[0.04]',
                    idx === 0
                      ? 'border-cyan-400/40 bg-cyan-500/5 shadow-[0_0_24px_rgba(34,211,238,0.12)]'
                      : 'border-white/10 bg-white/[0.02]'
                  )}
                >
                  <Avatar
                    className="w-10 h-10 border"
                    style={idx === 0 ? { borderColor: color.stroke, boxShadow: `0 0 14px ${color.glow}` } : undefined}
                  >
                    <AvatarImage src={resolveApiUrl(row.picture)} />
                    <AvatarFallback>{(row.artist_name || '?')[0]}</AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border',
                      color.rankBg
                    )}
                  >
                    {row.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{row.artist_name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {row.genre || 'Artiste Kloud'}
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold tabular-nums">{eur(row.revenue_cents)}</div>
                    {idx === 0 && (
                      <div className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 mt-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        leader
                      </div>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {contestId && (
          <Button
            asChild
            variant="outline"
            className="mt-4 w-full rounded-full border-white/15 hover:bg-white/5"
          >
            <Link to={`/concours/${contestId}`}>
              Voir le classement complet
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default RevenueRaceWidget;
