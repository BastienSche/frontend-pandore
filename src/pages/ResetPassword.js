import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { apiClient } from '@/lib/apiClient';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Lien de réinitialisation invalide');
      return;
    }
    if (password.length < 6) {
      toast.error('Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/auth/reset-password', {
        token,
        new_password: password
      });
      toast.success('Mot de passe mis à jour');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Lien invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <BubbleBackground />
      <GlowOrb color="cyan" size={500} x="20%" y="30%" blur={150} />
      <GlowOrb color="purple" size={400} x="80%" y="70%" blur={120} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-heavy rounded-[2.5rem] p-8 md:p-10 space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Nouveau{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                mot de passe
              </span>
            </h1>
            <p className="text-muted-foreground">
              Choisis un nouveau mot de passe pour ton compte.
            </p>
          </div>

          {!token ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              Lien invalide : token manquant.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium">
                  Nouveau mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 placeholder:text-muted-foreground/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirmer le mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 placeholder:text-muted-foreground/50"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 text-base font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  'Réinitialiser'
                )}
              </Button>
            </form>
          )}

          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour connexion
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
