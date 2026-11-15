import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiClient, formatApiError, googleOAuthLoginUrl } from '@/lib/apiClient';

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.6 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.9 2.2 2.7 6.4 2.7 11.5S6.9 20.8 12 20.8c6.1 0 8.1-4.3 8.1-6.5 0-.4 0-.8-.1-1.1H12z" />
  </svg>
);

export default function GoogleAuthButton({
  label = 'Continuer avec Google',
  disabled = false,
  testId = 'google-login-button'
}) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      const { data } = await apiClient.get('/api/auth/google/status');
      if (!data?.configured) {
        toast.error('Connexion Google indisponible pour le moment');
        return;
      }
      window.location.assign(googleOAuthLoginUrl());
    } catch (error) {
      toast.error(formatApiError(error, 'Connexion Google indisponible'));
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full h-14 rounded-full border-white/15 bg-white/5 hover:bg-white/10 text-base font-medium"
      disabled={disabled || busy}
      onClick={handleClick}
      data-testid={testId}
    >
      {busy ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <GoogleMark />}
      {label}
    </Button>
  );
}
