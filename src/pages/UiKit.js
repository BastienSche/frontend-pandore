import React from 'react';
import { Link } from 'react-router-dom';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StorySection from '@/stories/StorySection';
import { AppComponentsStories } from '@/stories/AppComponents.stories';
import { UiComponentsStories } from '@/stories/UiComponents.stories';

const sections = [
  {
    id: 'app-components',
    title: 'Composants App',
    description:
      'Composants réutilisables spécifiques à Pandore (cards, background, player).',
    render: () => <AppComponentsStories />
  },
  {
    id: 'ui-primitives',
    title: 'UI Primitives',
    description:
      'Composants génériques (Radix/shadcn) utilisés partout dans l’app.',
    render: () => <UiComponentsStories />
  }
];

export default function UiKit() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <BubbleBackground />

      <GlowOrb color="cyan" size={650} x="18%" y="18%" blur={160} />
      <GlowOrb color="purple" size={520} x="88%" y="40%" blur={130} />
      <GlowOrb color="pink" size={420} x="50%" y="92%" blur={110} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-24">
        <div className="glass-heavy border border-white/10 rounded-[2.5rem] p-8 md:p-10">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20">
                  Pandore UI Kit
                </Badge>
                <Badge className="bg-white/5 border-white/10 text-muted-foreground">
                  demo interne
                </Badge>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-none">
                Design system
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
                  Storybook-like
                </span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-3xl">
                Cette page répertorie les composants réutilisables avec des démos
                et des variantes pour recréer le style de l’app.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/">
                  <Button variant="outline" className="glass border-white/10">
                    Retour Home
                  </Button>
                </Link>
                <a href="#app-components">
                  <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 border-0">
                    Voir les composants
                  </Button>
                </a>
              </div>
            </div>

            <div className="glass border border-white/10 rounded-3xl p-6 min-w-[280px]">
              <div className="text-sm font-medium mb-3">Sommaire</div>
              <div className="space-y-2">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block rounded-2xl px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="font-medium">{s.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {s.description}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          {sections.map((section) => (
            <StorySection
              key={section.id}
              id={section.id}
              title={section.title}
              description={section.description}
            >
              {section.render()}
            </StorySection>
          ))}
        </div>
      </div>
    </div>
  );
}

