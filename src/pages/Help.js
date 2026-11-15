import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';

const FAQ = [
  {
    q: 'Kloud, c’est du streaming ?',
    a: 'Non. Tu découvres avec des extraits, tu achètes ce que tu veux garder, et ça reste dans ta bibliothèque. L’idée c’est la propriété, pas l’abonnement.'
  },
  {
    q: 'Je n’ai pas reçu l’e-mail de réinitialisation de mot de passe',
    a: 'Vérifie les spams. L’envoi dépend de la config mail du serveur. Si rien n’arrive, écris à support@kloud-music.fr avec l’adresse du compte.'
  },
  {
    q: 'J’ai payé mais le titre n’est pas dans Bibliothèque',
    a: 'Attends quelques secondes puis recharge la page Bibliothèque. Si Stripe a bien débité, le statut de session doit créditer le compte. Contacte-nous avec l’e-mail d’achat et le nom du titre.'
  },
  {
    q: 'Preview vs fichier complet',
    a: 'Sans achat tu entends un extrait. Après achat (ou titre gratuit ajouté), le fichier complet est dans Bibliothèque, avec téléchargement quand il est proposé.'
  },
  {
    q: 'Je veux vendre ma musique',
    a: 'Connecte-toi, passe en mode Artiste (une fois le pseudo choisi), publie un titre depuis le dashboard. Les acheteurs paient Kloud ; ta part va en cagnotte. Le retrait se fait via Stripe Connect à partir du seuil affiché (10 € par défaut).'
  },
  {
    q: 'Google / connexion',
    a: 'Le bouton Google n’apparaît comme disponible que si l’équipe a renseigné Client ID et secret. Sinon, inscris-toi avec e-mail et mot de passe.'
  },
  {
    q: 'Mes données, mes cookies',
    a: 'Les pages Confidentialité et Cookies expliquent ce qui est collecté. Tu peux refuser la mesure d’audience dans le bandeau cookies.'
  }
];

const Help = () => {
  useEffect(() => {
    document.title = 'Aide · Kloud';
    return () => {
      document.title = 'Kloud';
    };
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden pb-24">
      <BubbleBackground />
      <GlowOrb color="purple" size={500} x="80%" y="20%" blur={150} />
      <GlowOrb color="cyan" size={420} x="12%" y="70%" blur={140} />

      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-8 pt-28">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/80">Support</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">Aide</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Les questions qui reviennent. Si ça ne débloque pas,{' '}
          <Link to="/contact" className="text-cyan-300 hover:underline">
            contacte-nous
          </Link>
          .
        </p>

        <div className="mt-10 space-y-4">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="glass-heavy rounded-3xl border border-white/10 p-6 group"
            >
              <summary className="cursor-pointer list-none font-semibold text-lg flex items-center justify-between gap-4">
                {item.q}
                <span className="text-muted-foreground group-open:rotate-45 transition-transform text-2xl leading-none">
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Help;
