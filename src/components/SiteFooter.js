import React from 'react';
import { Link } from 'react-router-dom';
import KloudLogo from '@/components/KloudLogo';
import { LEGAL_CONTACT_EMAIL, LEGAL_PAGES } from '@/lib/legalContent';

const COLUMNS = [
  {
    title: 'Kloud',
    links: [
      { to: '/', label: 'Accueil' },
      { to: '/browse', label: 'Découvrir' },
      { to: '/nous-decouvrir', label: 'Le projet' },
      { to: '/concours', label: 'Concours' }
    ]
  },
  {
    title: 'Aide',
    links: [
      { to: '/aide', label: 'Centre d’aide' },
      { to: '/contact', label: 'Contact' },
      { href: `mailto:${LEGAL_CONTACT_EMAIL}`, label: LEGAL_CONTACT_EMAIL }
    ]
  },
  {
    title: 'Légal',
    links: LEGAL_PAGES.map((page) => ({
      to: page.path,
      label: page.slug === 'mentions-legales' ? 'Mentions légales' : page.short
    }))
  }
];

const SiteFooter = () => (
  <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-md pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-10">
    <div className="max-w-6xl mx-auto px-6 md:px-8 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1 space-y-3">
          <Link to="/" className="inline-flex items-center gap-2 text-foreground">
            <KloudLogo className="w-8 h-8" />
            <span className="font-semibold tracking-tight">Kloud</span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Découvrir, acheter, garder. Musique en vrai, pas en location.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-3">{column.title}</div>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  {link.href ? (
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors break-all">
                      {link.label}
                    </a>
                  ) : (
                    <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Kloud · kloud-music.fr</span>
        <span>Paiements sécurisés par Stripe</span>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
