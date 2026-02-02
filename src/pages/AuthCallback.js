import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    toast.success('Connexion simulée réussie');
    navigate('/browse');
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Connexion en cours...</p>
    </div>
  );
};

export default AuthCallback;