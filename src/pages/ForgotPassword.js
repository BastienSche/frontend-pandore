import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { apiClient } from '@/lib/apiClient';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [debugResetUrl, setDebugResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiClient.post('/api/auth/forgot-password', { email });
      setSubmitted(true);
      if (data?.reset_url) setDebugResetUrl(data.reset_url);
      toast.success(data?.message || 'Si ce compte existe, un lien a été envoyé.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
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
              Mot de passe{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                oublié
              </span>
            </h1>
            <p className="text-muted-foreground">
              Entre ton email et on te génère un lien de réinitialisation.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    Envoi...
                  </>
                ) : (
                  'Générer un lien'
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Si le compte existe, le lien est prêt.
              </p>
              {debugResetUrl && (
                <a
                  href={debugResetUrl}
                  className="block rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-200 hover:text-cyan-100 transition-colors break-all"
                >
                  Ouvrir le lien de reset (mode dev)
                </a>
              )}
            </div>
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

export default ForgotPassword;
