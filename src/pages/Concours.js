import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Trophy, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import RevenueRaceWidget from '@/components/RevenueRaceWidget';
import { apiClient, formatApiError, resolveApiUrl } from '@/lib/apiClient';

const eur = (cents) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format((Number(cents) || 0) / 100);

const formatRange = (startsAt, endsAt) => {
  try {
    const a = new Date(startsAt);
    const b = new Date(endsAt);
    return `${a.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} — ${b.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  } catch {
    return '';
  }
};

const Concours = () => {
  const { contestId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const url = contestId ? `/api/contests/${contestId}?limit=50` : '/api/contests/current';
        const { data } = await apiClient.get(url);
        if (cancelled) return;
        if (!data?.contest) {
          setError('Aucun concours publié pour le moment.');
          setPayload(null);
        } else {
          setPayload(data);
        }
      } catch (e) {
        if (!cancelled) setError(formatApiError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [contestId]);

  const contest = payload?.contest;
  const leaderboard = payload?.leaderboard || [];

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden">
      <BubbleBackground />
      <GlowOrb color="cyan" size={640} x="10%" y="20%" blur={160} />
      <GlowOrb color="purple" size={560} x="90%" y="70%" blur={160} />

      <div className="relative pt-28 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <Button asChild variant="ghost" className="rounded-full mb-6 -ml-2">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Accueil
            </Link>
          </Button>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="rounded-full px-4 py-1.5 bg-cyan-500/15 border border-cyan-400/35 text-cyan-100 backdrop-blur-md shadow-[0_0_20px_rgba(34,211,238,0.15)]">
                <Trophy className="w-4 h-4 mr-2 inline text-cyan-300" />
                Concours
              </Badge>
              {contest?.phase === 'live' && (
                <Badge className="rounded-full px-3 py-1 bg-gradient-to-r from-fuchsia-500 to-violet-500 border-0 text-white font-semibold tracking-wide">
                  LIVE
                </Badge>
              )}
            </div>

            <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tighter">
              {contest?.title || 'Course aux revenus'}
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              {contest?.subtitle ||
                'L’artiste qui génère le plus d’euros (ventes) pendant la période remporte la course.'}
            </p>
            {contest && (
              <p className="mt-2 text-sm text-muted-foreground/80">
                {formatRange(contest.starts_at, contest.ends_at)}
                {contest.prize_label ? ` · Prix : ${contest.prize_label}` : ''}
              </p>
            )}
          </motion.div>

          {loading ? (
            <div className="mt-10 glass-heavy rounded-[28px] p-10 border border-white/10 flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Chargement du classement…
            </div>
          ) : error ? (
            <div className="mt-10 glass-heavy rounded-[28px] p-10 border border-white/10">
              <div className="font-semibold">Concours indisponible</div>
              <p className="mt-2 text-muted-foreground">{error}</p>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                <RevenueRaceWidget
                  contest={contest}
                  leaderboard={leaderboard}
                  series={payload?.series || []}
                  days={payload?.days || []}
                />
              </div>

              <div className="lg:col-span-2 space-y-3">
                <div className="glass-heavy rounded-[28px] border border-white/10 p-5">
                  <h2 className="font-semibold text-lg">Classement complet</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Revenus artistes (ventes payées) sur la période du concours.
                  </p>
                  <div className="mt-4 space-y-2 max-h-[560px] overflow-auto pr-1">
                    {leaderboard.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">
                        Aucune vente pour l’instant.
                      </p>
                    ) : (
                      leaderboard.map((row) => (
                        <Link
                          key={row.artist_id}
                          to={`/artist/${row.artist_id}`}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.05] transition-colors"
                        >
                          <span className="w-7 text-center text-sm font-bold text-muted-foreground tabular-nums">
                            {row.rank}
                          </span>
                          <Avatar className="w-9 h-9">
                            <AvatarImage src={resolveApiUrl(row.picture)} />
                            <AvatarFallback>{(row.artist_name || '?')[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{row.artist_name}</div>
                            {row.genre && (
                              <div className="text-[11px] text-muted-foreground truncate">{row.genre}</div>
                            )}
                          </div>
                          <div className="font-semibold tabular-nums text-sm">{eur(row.revenue_cents)}</div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Concours;
