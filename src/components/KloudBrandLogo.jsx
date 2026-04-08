import React from 'react';
import { cn } from '@/lib/utils';

/** Logo image (nom « Kloud » dans le visuel) — `public/kloud-logo.png`. */
const KloudBrandLogo = ({ className, variant = 'nav', ...props }) => {
  const src = `${process.env.PUBLIC_URL || ''}/kloud-logo.png`;
  const variants = {
    nav: 'h-8 w-auto max-w-[148px] sm:h-9 sm:max-w-[176px] object-contain object-left',
    auth: 'h-auto w-full max-h-24 max-w-[280px] object-contain mx-auto'
  };
  return (
    <img src={src} alt="Kloud" className={cn(variants[variant] || variants.nav, className)} {...props} />
  );
};

export default KloudBrandLogo;
