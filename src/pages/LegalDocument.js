import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { Button } from '@/components/ui/button';
import { LEGAL_PAGES, LEGAL_SECTIONS, LEGAL_UPDATED_AT, getLegalPage } from '@/lib/legalContent';
import { getCookieConsent, setCookieConsent } from '@/lib/cookieConsent';

const LegalDocument = ({ slug: slugProp }) => {
  const { slug: slugParam } = useParams();
  const slug = slugProp || slugParam;
  const page = getLegalPage(slug);
  const sections = slug ? LEGAL_SECTIONS[slug] : null;
  const [consent, setConsent] = useState(null);

  useEffect(() => {
    setConsent(getCookieConsent());
  }, [slug]);

  useEffect(() => {
    document.title = page ? `${page.title} · Kloud` : 'Informations légales · Kloud';
    return () => {
      document.title = 'Kloud';
    };
  }, [page]);

  if (slug && !page) return <Navigate to="/legal" replace />;

  return (
    <div className="min-h-screen relative overflow-hidden pb-24">
      <BubbleBackground />
      <GlowOrb color="cyan" size={520} x="12%" y="18%" blur={150} />
      <GlowOrb color="purple" size={480} x="88%" y="72%" blur={150} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-8 pt-28">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/80">
          {page ? page.kicker : 'Légal'}
        </p>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
          {page ? page.title : 'Informations légales'}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Dernière mise à jour : {LEGAL_UPDATED_AT}
        </p>

        <nav
          className="mt-8 flex flex-wrap gap-2"
          aria-label="Documents légaux"
        >
          <Link
            to="/legal"
            className={`rounded-full px-4 py-2 text-sm border transition-colors ${
              !page ? 'border-cyan-400/40 bg-cyan-500/15 text-foreground' : 'border-white/10 bg-white/5 text-muted-foreground hover:text-foreground'
            }`}
          >
            Sommaire
          </Link>
          {LEGAL_PAGES.map((item) => (
            <Link
              key={item.slug}
              to={item.path}
              className={`rounded-full px-4 py-2 text-sm border transition-colors ${
                item.slug === slug
                  ? 'border-cyan-400/40 bg-cyan-500/15 text-foreground'
                  : 'border-white/10 bg-white/5 text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.short}
            </Link>
          ))}
        </nav>

        {!page && (
          <div className="mt-10 grid gap-4">
            {LEGAL_PAGES.map((item) => (
              <Link
                key={item.slug}
                to={item.path}
                className="glass-heavy rounded-3xl border border-white/10 p-6 hover:border-white/20 transition-colors"
              >
                <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{item.kicker}</div>
                <div className="mt-1 text-xl font-semibold">{item.title}</div>
              </Link>
            ))}
          </div>
        )}

        {page && (
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 glass-heavy rounded-[32px] border border-white/10 p-8 md:p-12 space-y-10"
          >
            {(sections || []).map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
                <div className="mt-3 space-y-3 text-muted-foreground leading-relaxed">
                  {section.body.map((paragraph, index) => (
                    <p key={`${section.title}-${index}`}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
            {slug === 'cookies' && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="text-sm text-muted-foreground flex-1">
                  Choix actuel :{' '}
                  <span className="text-foreground font-medium">
                    {consent === 'accepted' ? 'audience acceptée' : consent === 'refused' ? 'audience refusée' : 'pas encore choisi'}
                  </span>
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => setConsent(setCookieConsent('refused'))}>
                    Refuser
                  </Button>
                  <Button
                    type="button"
                    className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 border-0"
                    onClick={() => setConsent(setCookieConsent('accepted'))}
                  >
                    Accepter
                  </Button>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground/80 pt-4 border-t border-white/10">
              Ces textes décrivent le fonctionnement actuel de Kloud. Ils ne remplacent pas un conseil juridique personnalisé.
              Contact :{' '}
              <a className="text-cyan-300 hover:underline" href="mailto:support@kloud-music.fr">
                support@kloud-music.fr
              </a>
            </p>
          </motion.article>
        )}
      </div>
    </div>
  );
};

export default LegalDocument;
