import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Music, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast.success('Connexion réussie !');
      navigate('/browse');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Effects */}
      <BubbleBackground />
      <GlowOrb color="cyan" size={500} x="20%" y="30%" blur={150} />
      <GlowOrb color="purple" size={400} x="80%" y="70%" blur={120} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
        data-testid="login-card"
      >
        <div className="glass-heavy rounded-[2.5rem] p-8 md:p-10 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
              className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.3)]"
            >
              <Music className="w-10 h-10 text-white" />
            </motion.div>
            
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Bienvenue sur{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  Pandore
                </span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Connectez-vous pour accéder à votre bibliothèque
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 placeholder:text-muted-foreground/50"
                  required
                  data-testid="login-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 placeholder:text-muted-foreground/50"
                  required
                  data-testid="login-password-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 text-base font-medium shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] transition-shadow"
              disabled={loading}
              data-testid="login-submit-button"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ?{' '}
            <Link 
              to="/register" 
              className="text-cyan-400 font-medium hover:text-cyan-300 transition-colors" 
              data-testid="register-link"
            >
              S'inscrire
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
