import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { COOKIE_CONSENT_EVENT, getCookieConsent, setCookieConsent } from '@/lib/cookieConsent';

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => setVisible(!getCookieConsent());
    sync();
    window.addEventListener(COOKIE_CONSENT_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, sync);
  }, []);

  if (!visible) return null;

  const choose = (value) => {
    setCookieConsent(value);
    setVisible(false);
  };

  return (
    <div
      className="fixed inset-x-0 z-[60] px-3 sm:px-6 bottom-[calc(8.5rem+env(safe-area-inset-bottom))] md:bottom-8"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <div className="max-w-3xl mx-auto glass-heavy rounded-3xl border border-white/15 p-4 sm:p-5 shadow-[0_12px_50px_rgba(0,0,0,0.35)]">
        <p id="cookie-banner-title" className="font-semibold">
          Cookies
        </p>
        <p id="cookie-banner-desc" className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Les cookies de connexion et de lecture sont nécessaires. La mesure d’audience (stats internes) n’est envoyée
          que si tu acceptes.{' '}
          <Link to="/cookies" className="text-cyan-300 hover:underline">
            Politique cookies
          </Link>
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button type="button" variant="outline" className="rounded-full" onClick={() => choose('refused')}>
            Refuser
          </Button>
          <Button
            type="button"
            className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 border-0"
            onClick={() => choose('accepted')}
          >
            Tout accepter
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
