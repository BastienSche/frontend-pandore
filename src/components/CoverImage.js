import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export const KLOUD_COVER_FALLBACK = `${process.env.PUBLIC_URL || ''}/kloud-logo.png`;

const isUnusableImage = (img) => {
  const w = Number(img?.naturalWidth) || 0;
  const h = Number(img?.naturalHeight) || 0;
  return !w || !h || w < 32 || h < 32;
};

/** Cover that always fills its box: real artwork, or the Kloud logo if anything fails. */
const CoverImage = ({ src, alt = '', className, imgClassName, ...rest }) => {
  const cleanSrc = String(src || '').trim();
  const [failed, setFailed] = useState(!cleanSrc);

  useEffect(() => {
    setFailed(!cleanSrc);
  }, [cleanSrc]);

  return (
    <div className={cn('relative overflow-hidden bg-[#07111f]', className)} {...rest}>
      {!failed && cleanSrc ? (
        <img
          src={cleanSrc}
          alt={alt}
          className={cn('w-full h-full object-cover', imgClassName)}
          loading="lazy"
          onError={() => setFailed(true)}
          onLoad={(e) => {
            if (isUnusableImage(e.currentTarget)) setFailed(true);
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-950 via-cyan-950/40 to-purple-950/50">
          <img
            src={KLOUD_COVER_FALLBACK}
            alt=""
            className="w-[58%] h-[58%] max-w-[220px] max-h-[220px] object-contain opacity-90 pointer-events-none select-none"
            draggable={false}
          />
        </div>
      )}
    </div>
  );
};

export default CoverImage;
