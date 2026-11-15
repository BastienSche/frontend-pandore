import React from 'react';
import { Apple, Globe, Instagram, Link2, Music2, Youtube } from 'lucide-react';
import { smartLinkLabel } from '@/lib/smartLinks';

const iconFor = (kind) => {
  if (kind === 'instagram') return Instagram;
  if (kind === 'youtube') return Youtube;
  if (kind === 'apple') return Apple;
  if (kind === 'spotify' || kind === 'presave' || kind === 'soundcloud') return Music2;
  if (kind === 'website') return Globe;
  return Link2;
};

const SmartLinksList = ({ links }) => {
  const items = Array.isArray(links) ? links.filter((l) => l?.url) : [];
  if (!items.length) return null;
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {items.map((link) => {
        const Icon = iconFor(link.kind);
        return (
          <a
            key={`${link.kind}-${link.url}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm glass border border-white/10 hover:border-cyan-400/40 hover:bg-white/10 transition-colors"
          >
            <Icon className="w-4 h-4" />
            {smartLinkLabel(link)}
          </a>
        );
      })}
    </div>
  );
};

export default SmartLinksList;
