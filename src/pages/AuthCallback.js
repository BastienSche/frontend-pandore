import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError, persistTokens } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { consumePostLoginPath } from '@/lib/postLoginRedirect';

const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);
  const { checkAuth } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    (async () => {
      const search = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const read = (key) => search.get(key) || hash.get(key);
      const oauthError = read('error');
      const token = read('access_token') || read('token') || read('session_token');
      const refreshToken = read('refresh_token');

      window.history.replaceState({}, document.title, window.location.pathname);

      if (oauthError) {
        toast.error(oauthError === 'access_denied' ? 'Connexion Google annulée' : oauthError);
        navigate('/login', { replace: true });
        return;
      }

      if (token || refreshToken) {
        persistTokens({ token, refreshToken: refreshToken || undefined });
      }

      try {
        const user = await checkAuth({ strict: true });
        if (!user) {
          throw new Error('Session Google introuvable');
        }
        toast.success('Connexion réussie');
        navigate(consumePostLoginPath('/browse'), { replace: true });
      } catch (e) {
        toast.error(formatApiError(e, 'Connexion Google incomplète'));
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate, checkAuth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Connexion en cours...</p>
    </div>
  );
};

export default AuthCallback;
