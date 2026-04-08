import React, { useEffect, useMemo, useState } from 'react';
import AlbumCard from '@/components/AlbumCard';
import TrackCard from '@/components/TrackCard';
import BubbleCard, { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import AudioPlayer from '@/components/AudioPlayer';
import HeroRouletteBand from '@/components/HeroRouletteBand';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { getAlbums, getTracks } from '@/data/fakeData';

function ensureDemoUser() {
  try {
    const key = 'kloud_fake_user';
    const existing = window.localStorage.getItem(key);
    if (existing) return;
    window.localStorage.setItem(
      key,
      JSON.stringify({
        user_id: 'artist_0',
        name: 'Demo User',
        email: 'demo@kloud.app',
        role: 'artist',
        artist_name: 'Demo Artist',
        picture: 'https://picsum.photos/seed/kloud-demo-user/200/200'
      })
    );
  } catch {
    // ignore
  }
}

export function AppComponentsStories() {
  const albums = useMemo(() => getAlbums().slice(0, 4), []);
  const tracks = useMemo(() => getTracks().slice(0, 6), []);
  const [showBackground, setShowBackground] = useState(true);
  const [orbSize, setOrbSize] = useState(500);

  useEffect(() => {
    ensureDemoUser();
  }, []);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-heavy rounded-3xl p-6 border border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20">
              App components
            </Badge>
            <Badge className="bg-white/5 border-white/10 text-muted-foreground">
              interactif
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Démos des composants “métier” (cards, background, audio player). Les
            providers globaux (theme/audio) sont ceux de l’app.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex items-center gap-3">
            <Switch checked={showBackground} onCheckedChange={setShowBackground} />
            <span className="text-sm text-muted-foreground">Bubble background</span>
          </div>
          <div className="min-w-[220px]">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Glow orb size</span>
              <span>{orbSize}px</span>
            </div>
            <Slider
              value={[orbSize]}
              onValueChange={(v) => setOrbSize(v?.[0] ?? 500)}
              min={250}
              max={900}
              step={10}
            />
          </div>
        </div>
      </div>

      <div className="relative rounded-[2.25rem] overflow-hidden border border-white/10">
        {showBackground ? <BubbleBackground /> : null}
        <GlowOrb color="cyan" size={orbSize} x="15%" y="25%" blur={150} />
        <GlowOrb color="purple" size={Math.round(orbSize * 0.85)} x="85%" y="60%" blur={120} />
        <GlowOrb color="pink" size={Math.round(orbSize * 0.7)} x="50%" y="95%" blur={100} />

        <div className="relative z-10 p-8 md:p-10 space-y-10">
          <div className="space-y-4">
            <div className="text-xl font-semibold">BubbleCard</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BubbleCard glowColor="cyan" className="p-6 rounded-3xl glass-heavy">
                <div className="font-semibold">Cyan bubble</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Hover pour voir la levitation.
                </div>
              </BubbleCard>
              <BubbleCard glowColor="purple" className="p-6 rounded-3xl glass-heavy">
                <div className="font-semibold">Purple bubble</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Même composant, autre glow.
                </div>
              </BubbleCard>
              <BubbleCard glowColor="pink" className="p-6 rounded-3xl glass-heavy">
                <div className="font-semibold">Pink bubble</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Click optionnel via prop.
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="glass border-white/10"
                    onClick={() => alert('BubbleCard click')}
                  >
                    Tester
                  </Button>
                </div>
              </BubbleCard>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xl font-semibold">TrackCard</div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {tracks.map((track) => (
                <TrackCard key={track.track_id} track={track} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xl font-semibold">AlbumCard</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {albums.map((album) => (
                <AlbumCard key={album.album_id} album={album} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xl font-semibold">AudioPlayer</div>
            <div className="text-sm text-muted-foreground">
              Lance une preview depuis une TrackCard, le player apparaît en bas.
            </div>
            <AudioPlayer />
          </div>

          <div className="space-y-2">
            <div className="text-xl font-semibold">HeroRouletteBand</div>
            <div className="text-sm text-muted-foreground">
              Bandeau “roulette” (démo). Utilise l’API si dispo, sinon il affiche un fallback.
            </div>
            <HeroRouletteBand />
          </div>
        </div>
      </div>
    </div>
  );
}

