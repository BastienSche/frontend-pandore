import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';

const storageKey = (id) => `kloud:contestDismiss:${id}`;

const formatRange = (startsAt, endsAt) => {
  try {
    const a = new Date(startsAt);
    const b = new Date(endsAt);
    const opts = { day: 'numeric', month: 'short' };
    return `${a.toLocaleDateString('fr-FR', opts)} → ${b.toLocaleDateString('fr-FR', opts)}`;
  } catch {
    return '';
  }
};

const ContestAnnounceModal = () => {
  const [contest, setContest] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get('/api/contests/current')
      .then(({ data }) => {
        if (cancelled) return;
        const c = data?.contest;
        if (!c?.contest_id) return;
        if (c.phase !== 'live' && c.phase !== 'upcoming') return;
        try {
          if (sessionStorage.getItem(storageKey(c.contest_id))) return;
        } catch {
          // ignore
        }
        setContest(c);
        setOpen(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    setOpen(false);
    if (contest?.contest_id) {
      try {
        sessionStorage.setItem(storageKey(contest.contest_id), '1');
      } catch {
        // ignore
      }
    }
  };

  if (!open || !contest) return null;

  return (
    <div
      className="fixed bottom-[calc(7.5rem+env(safe-area-inset-bottom))] md:bottom-24 right-3 md:right-6 z-[60] w-[min(100vw-1.5rem,20rem)] pointer-events-auto"
      data-testid="contest-announce-modal"
    >
      <div className="glass-heavy rounded-3xl border border-white/15 shadow-[0_16px_50px_rgba(0,0,0,0.45)] overflow-hidden">
        <div className="relative p-4">
          <button
            type="button"
            onClick={dismiss}
            className="absolute top-3 right-3 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 pr-8">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-white/10">
              <Trophy className="w-4 h-4 text-cyan-300" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{contest.title}</p>
                {contest.phase === 'live' && (
                  <Badge className="rounded-full text-[9px] px-2 py-0 bg-gradient-to-r from-fuchsia-500 to-violet-500 border-0">
                    LIVE
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {formatRange(contest.starts_at, contest.ends_at)}
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            {contest.subtitle ||
              'Qui génère le plus d’euros sur la période ? Suis la course en direct.'}
          </p>
          {contest.prize_label && (
            <p className="mt-2 text-xs text-cyan-300/90 font-medium">Prix : {contest.prize_label}</p>
          )}

          <Button
            asChild
            size="sm"
            className="mt-3 w-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 border-0"
            onClick={dismiss}
          >
            <Link to={`/concours/${contest.contest_id}`}>
              Voir le concours
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContestAnnounceModal;
