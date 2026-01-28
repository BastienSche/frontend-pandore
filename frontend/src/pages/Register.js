import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Music, Mail, Lock, User, Loader2, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isArtist, setIsArtist] = useState(false);
  const [artistName, setArtistName] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await register(email, password, name, isArtist ? artistName : null);
      toast.success('Inscription réussie ! Veuillez vous connecter.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-24 relative overflow-hidden">
      {/* Background Effects */}
      <BubbleBackground />
      <GlowOrb color="purple" size={500} x="80%" y="20%" blur={150} />
      <GlowOrb color="cyan" size={400} x="20%" y="80%" blur={120} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
        data-testid="register-card"
      >
        <div className="glass-heavy rounded-[2.5rem] p-8 md:p-10 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
              className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.3)]"
            >
              <Music className="w-10 h-10 text-white" />
            </motion.div>
            
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Rejoignez{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Pandore
                </span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Créez votre compte pour commencer
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nom complet</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 placeholder:text-muted-foreground/50"
                  required
                  data-testid="register-name-input"
                />
              </div>
            </div>

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
                  className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 placeholder:text-muted-foreground/50"
                  required
                  data-testid="register-email-input"
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
                  className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 placeholder:text-muted-foreground/50"
                  required
                  minLength={6}
                  data-testid="register-password-input"
                />
              </div>
            </div>

            {/* Artist Checkbox */}
            <div className="flex items-center space-x-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <Checkbox
                id="artist"
                checked={isArtist}
                onCheckedChange={setIsArtist}
                className="border-purple-500/50 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                data-testid="register-artist-checkbox"
              />
              <Label htmlFor="artist" className="cursor-pointer flex items-center gap-2">
                <Mic className="w-4 h-4 text-purple-400" />
                Je suis un artiste
              </Label>
            </div>

            {/* Artist Name Field */}
            <AnimatePresence>
              {isArtist && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2 overflow-hidden"
                >
                  <Label htmlFor="artistName" className="text-sm font-medium">Nom d'artiste</Label>
                  <div className="relative">
                    <Mic className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                    <Input
                      id="artistName"
                      type="text"
                      placeholder="Votre nom de scène"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      className="pl-12 h-14 rounded-2xl bg-purple-500/10 border-purple-500/30 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 placeholder:text-muted-foreground/50"
                      required={isArtist}
                      data-testid="register-artist-name-input"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              className="w-full h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 border-0 text-base font-medium shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-shadow"
              disabled={loading}
              data-testid="register-submit-button"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Inscription...
                </>
              ) : (
                'S\'inscrire'
              )}
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <Link 
              to="/login" 
              className="text-purple-400 font-medium hover:text-purple-300 transition-colors" 
              data-testid="login-link"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
