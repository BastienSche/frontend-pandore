import React from 'react';
import { Navigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_EMAILS, isAdminEmail } from '@/lib/adminEmails';
import { Button } from '@/components/ui/button';

const AdminProtectedRoute = ({ children }) => {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading && !user) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!isAdminEmail(user?.email)) {
    return (
      <div className="min-h-screen pt-28 px-6">
        <div className="max-w-lg mx-auto rounded-[28px] border border-white/10 bg-black/40 p-8">
          <div className="flex items-center gap-2 text-amber-300">
            <Shield className="w-5 h-5" />
            <h1 className="text-xl font-semibold">Accès admin refusé</h1>
          </div>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Connecté en tant que{' '}
            <span className="font-medium text-foreground">{user?.email || 'email inconnu'}</span>.
          </p>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Seuls ces comptes peuvent ouvrir cette page : {ADMIN_EMAILS.join(', ')}.
          </p>
          <Button className="mt-6 rounded-full" variant="outline" onClick={() => window.location.assign('/')}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminProtectedRoute;
