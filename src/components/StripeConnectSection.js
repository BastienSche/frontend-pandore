import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';

import { apiClient, formatApiError } from '@/lib/apiClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const euros = (cents) => (Number(cents || 0) / 100).toFixed(2);

const connectLabel = (wallet, status) => {
  if (status && status.connect_enabled === false) return { text: 'Indisponible', className: 'bg-white/10 text-muted-foreground border-white/15' };
  if (wallet?.connect_ready || status?.charges_enabled || status?.payouts_enabled) {
    return { text: 'Actif', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  }
  if (status?.details_submitted) {
    return { text: 'Validation Stripe', className: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
  }
  if (status?.has_account) {
    return { text: 'À terminer', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  }
  return { text: 'Non activé', className: 'bg-white/10 text-muted-foreground border-white/15' };
};

const StripeConnectSection = ({ returnTo = 'settings', testId = 'stripe-connect-section' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [connectStatus, setConnectStatus] = useState(null);
  const [connectBalance, setConnectBalance] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [connectActionLoading, setConnectActionLoading] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [statusError, setStatusError] = useState('');

  const loadConnectStatus = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/artist/stripe/connect/status');
      setConnectStatus(data);
      setStatusError('');
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
      return data;
    } catch (error) {
      setConnectStatus(null);
      setConnectBalance(null);
      const raw = formatApiError(error, 'Stripe injoignable');
      const unavailable = error?.response?.status === 503 || /STRIPE_API_KEY|non configur/i.test(raw);
      setStatusError(
        unavailable
          ? 'Stripe n’est pas encore disponible. Tu pourras activer Connect dès que les paiements sont configurés.'
          : raw
      );
      return null;
    }
  }, []);

  const loadWallet = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/artist/wallet');
      setWallet(data);
      return data;
    } catch {
      setWallet(null);
      return null;
    }
  }, []);

  const refreshAll = useCallback(async () => {
    const [status] = await Promise.all([loadConnectStatus(), loadWallet()]);
    return status;
  }, [loadConnectStatus, loadWallet]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const startStripeOnboarding = useCallback(async () => {
    setConnectActionLoading(true);
    try {
      const { data } = await apiClient.post(`/api/artist/stripe/connect/onboard?return_to=${encodeURIComponent(returnTo)}`);
      if (data?.url) window.location.assign(data.url);
      else toast.error("Pas d'URL Stripe");
    } catch (e) {
      toast.error(formatApiError(e, 'Erreur Stripe'));
    } finally {
      setConnectActionLoading(false);
    }
  }, [returnTo]);

  const openStripeExpress = async () => {
    const popup = window.open('about:blank', 'kloud_stripe_express');
    try {
      const { data } = await apiClient.post('/api/artist/stripe/connect/login-link');
      if (!data?.url) {
        popup?.close();
        toast.error("Pas d'URL Stripe");
        return;
      }
      if (popup && !popup.closed) popup.location.replace(data.url);
      else window.location.assign(data.url);
    } catch (e) {
      popup?.close();
      toast.error(formatApiError(e, 'Erreur'));
    }
  };

  const withdrawWallet = async () => {
    if (wallet?.withdraw_blocked_reason === 'connect_required') {
      await startStripeOnboarding();
      return;
    }
    setPayoutLoading(true);
    try {
      const { data } = await apiClient.post('/api/artist/wallet/payout');
      toast.success(`Retrait de ${euros(data?.amount_cents)} € envoyé vers Stripe`);
      await refreshAll();
    } catch (e) {
      toast.error(formatApiError(e, 'Retrait impossible'));
    } finally {
      setPayoutLoading(false);
    }
  };

  const clearConnectFlag = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    if (!next.has('connect')) return;
    next.delete('connect');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const flag = searchParams.get('connect');
    if (!flag) return;
    (async () => {
      if (flag === 'refresh') {
        toast.info('Le lien Stripe a expiré — nouvel onboarding…');
        clearConnectFlag();
        await startStripeOnboarding();
        return;
      }
      if (flag === 'return') {
        const status = await refreshAll();
        if (status?.charges_enabled || status?.payouts_enabled) {
          toast.success('Compte Stripe activé');
        } else if (status?.details_submitted) {
          toast.success('Informations Stripe envoyées — validation en cours');
        } else {
          toast.message('Retour Stripe — reprends l’activation si besoin');
        }
        clearConnectFlag();
      }
    })();
  }, [searchParams, clearConnectFlag, refreshAll, startStripeOnboarding]);

  const badge = connectLabel(wallet, connectStatus);
  const connectReady = !!(wallet?.connect_ready || connectStatus?.charges_enabled || connectStatus?.payouts_enabled);
  const minCents = Number(wallet?.min_payout_cents || 1000);
  const availableCents = Number(wallet?.available_cents || 0);

  return (
    <Card className="glass-heavy rounded-3xl border-white/10" data-testid={testId}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-400" />
          Stripe Connect
        </CardTitle>
        <Badge className={badge.className}>{badge.text}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Les acheteurs paient Kloud tout de suite. Ta part (après commission{' '}
          {wallet?.platform_fee_percent ?? connectStatus?.platform_fee_percent ?? '—'}
          %) va en cagnotte. Active Stripe Connect pour la retirer sur ton IBAN, à partir de{' '}
          {wallet?.min_payout_euros ?? 10} €.
        </p>

        {statusError ? (
          <p className="text-sm text-amber-300/90">{statusError}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {wallet?.can_withdraw ? (
            <Button
              type="button"
              className="rounded-full bg-emerald-600 hover:bg-emerald-500"
              disabled={payoutLoading}
              onClick={withdrawWallet}
              data-testid="stripe-connect-withdraw"
            >
              {payoutLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Retirer {euros(wallet.available_cents)} €
            </Button>
          ) : null}
          {!connectReady ? (
            <Button
              type="button"
              className="rounded-full bg-emerald-600 hover:bg-emerald-500"
              disabled={connectActionLoading || connectStatus?.connect_enabled === false || !!statusError}
              onClick={startStripeOnboarding}
              data-testid="stripe-connect-onboard"
            >
              {connectActionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {connectStatus?.has_account ? 'Terminer Stripe Connect' : 'Activer Stripe Connect'}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="rounded-full glass border-white/10"
              onClick={openStripeExpress}
              data-testid="stripe-connect-express"
            >
              Ouvrir Stripe Express
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-muted-foreground">Cagnotte Kloud</p>
            <p className="text-2xl font-semibold text-emerald-300">{euros(availableCents)} €</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-muted-foreground">Déjà retiré</p>
            <p className="text-lg font-semibold">{euros(wallet?.paid_out_cents)} €</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-muted-foreground">Seuil de retrait</p>
            <p className="text-lg font-semibold">{wallet?.min_payout_euros ?? 10} €</p>
          </div>
        </div>

        {wallet && availableCents < minCents ? (
          <div>
            <Progress value={Math.min(100, (availableCents / Math.max(1, minCents)) * 100)} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Encore {euros(Math.max(0, minCents - availableCents))} € avant de pouvoir retirer.
            </p>
          </div>
        ) : null}

        {connectStatus?.has_account && connectStatus?.charges_enabled && connectBalance ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-muted-foreground">Chez Stripe (disponible)</p>
              <p className="text-lg font-semibold">
                {euros(connectBalance.available_cents)} {String(connectBalance.currency || 'eur').toUpperCase()}
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-muted-foreground">Chez Stripe (en attente)</p>
              <p className="text-lg font-semibold">
                {euros(connectBalance.pending_cents)} {String(connectBalance.currency || 'eur').toUpperCase()}
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default StripeConnectSection;
