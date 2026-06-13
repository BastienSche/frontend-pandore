import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);
  const { checkAuth } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    (async () => {
      try {
        await checkAuth();
        toast.success('Connexion réussie');
      } catch (e) {
        toast.error(e.response?.data?.detail || 'Erreur de connexion');
      } finally {
        navigate('/browse');
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