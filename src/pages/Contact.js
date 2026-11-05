import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient, formatApiError } from '@/lib/apiClient';
import { LEGAL_CONTACT_EMAIL } from '@/lib/legalContent';

const Contact = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Contact · Kloud';
    return () => {
      document.title = 'Kloud';
    };
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (!cleanTitle || !cleanDescription) {
      toast.error('Titre et message sont requis');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', cleanTitle);
      formData.append('description', cleanDescription);
      if (image) formData.append('image', image);
      await apiClient.post('/api/feedback', formData);
      toast.success('Message envoyé — on te lit.');
      setTitle('');
      setDescription('');
      setImage(null);
      event.target.reset?.();
    } catch (error) {
      toast.error(formatApiError(error, 'Impossible d’envoyer le message'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-24">
      <BubbleBackground />
      <GlowOrb color="cyan" size={500} x="18%" y="24%" blur={150} />
      <GlowOrb color="purple" size={420} x="82%" y="70%" blur={140} />

      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-8 pt-28">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/80">Aide</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">Contact</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Une question d’achat, un fichier qui ne se lance pas, un compte artiste : écris-nous.
          Pour un bug précis, une capture aide beaucoup.
        </p>

        <div className="mt-8 glass-heavy rounded-3xl border border-white/10 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">E-mail</div>
            <a className="text-lg font-medium text-cyan-300 hover:underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
              {LEGAL_CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={onSubmit}
          className="mt-8 glass-heavy rounded-[32px] border border-white/10 p-8 space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="contact-title">Sujet</Label>
            <Input
              id="contact-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. : paiement confirmé, titre absent de la bibliothèque"
              className="h-12 rounded-xl bg-white/5 border-white/10"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-body">Message</Label>
            <Textarea
              id="contact-body"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={7}
              placeholder="Compte e-mail, titre concerné, ce que tu as fait, ce que tu vois…"
              className="rounded-xl bg-white/5 border-white/10"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-image">Image (optionnel)</Label>
            <Input
              id="contact-image"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="h-12 rounded-xl bg-white/5 border-white/10"
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-full h-12 px-8 bg-gradient-to-r from-cyan-500 to-purple-500 border-0"
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Envoyer
          </Button>
        </motion.form>

        <p className="mt-6 text-sm text-muted-foreground">
          FAQ : <Link to="/aide" className="text-cyan-300 hover:underline">page Aide</Link>
          {' · '}
          Documents : <Link to="/legal" className="text-cyan-300 hover:underline">légal</Link>
        </p>
      </div>
    </div>
  );
};

export default Contact;
