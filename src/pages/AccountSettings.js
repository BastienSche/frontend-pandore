import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Save, Settings, User, Bell, Shield, Headphones, Sparkles } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const LS_KEY = 'pandore_account_settings';

const loadLocalSettings = () => {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveLocalSettings = (value) => {
  window.localStorage.setItem(LS_KEY, JSON.stringify(value));
};

const defaultListenerSettings = {
  playback: {
    autoplay: true,
    normalizeVolume: true,
    highQualityStreaming: true
  },
  notifications: {
    newReleases: true,
    recommendations: true,
    purchases: true
  },
  privacy: {
    shareListeningActivity: false,
    personalizedAds: false
  }
};

const AccountSettings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, switchRole } = useAuth();

  const [activeTab, setActiveTab] = useState('account');
  const [saving, setSaving] = useState(false);

  // Role switching (auditeur <-> artiste)
  const [roleTargetIsArtist, setRoleTargetIsArtist] = useState(false);
  const [artistName, setArtistName] = useState('');

  // Artist profile (backend)
  const [artistProfile, setArtistProfile] = useState({
    name: '',
    bio: '',
    avatar_url: '',
    links: ['']
  });
  const [artistProfileExists, setArtistProfileExists] = useState(false);

  // Listener settings (local)
  const [listenerSettings, setListenerSettings] = useState(defaultListenerSettings);

  const isArtist = useMemo(() => user?.role === 'artist', [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    setRoleTargetIsArtist(user.role === 'artist');
    setArtistName(user.artist_name || '');

    const local = loadLocalSettings();
    if (local) setListenerSettings({ ...defaultListenerSettings, ...local });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'artist') return;

    (async () => {
      try {
        const { data } = await apiClient.get('/api/artist/profile');
        setArtistProfile({
          name: data?.name || user.artist_name || user.name || '',
          bio: data?.bio || '',
          avatar_url: data?.avatar_url || '',
          links: (data?.links?.length ? data.links : ['']).map((l) => l || '')
        });
        setArtistProfileExists(true);
      } catch (e) {
        // profile may not exist yet
        setArtistProfile({
          name: user.artist_name || user.name || '',
          bio: '',
          avatar_url: '',
          links: ['']
        });
        setArtistProfileExists(false);
      }
    })();
  }, [user]);

  const applyRoleChange = async () => {
    if (!user) return;

    const wantsArtist = roleTargetIsArtist;
    if (wantsArtist) {
      if (!artistName?.trim()) {
        toast.error("Le nom d'artiste est requis");
        return;
      }
      await switchRole(artistName.trim());
      toast.success('Mode Artiste activé');
      return;
    }

    await switchRole(null);
    toast.success('Mode Auditeur activé');
  };

  const saveArtistProfile = async () => {
    const payload = {
      name: artistProfile.name?.trim() || artistName?.trim() || user?.artist_name || user?.name || '',
      bio: artistProfile.bio || '',
      avatar_url: artistProfile.avatar_url || '',
      links: (artistProfile.links || []).map((l) => l.trim()).filter(Boolean)
    };

    if (!payload.name) {
      toast.error("Le nom d'artiste est requis");
      return;
    }

    if (artistProfileExists) {
      await apiClient.put('/api/artist/profile', payload);
    } else {
      await apiClient.post('/api/artist/profile', payload);
      setArtistProfileExists(true);
    }
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await applyRoleChange();
      saveLocalSettings(listenerSettings);
      if (roleTargetIsArtist) {
        await saveArtistProfile();
      }
      toast.success('Réglages enregistrés');
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden">
      <BubbleBackground />
      <GlowOrb color="cyan" size={520} x="15%" y="25%" blur={150} />
      <GlowOrb color="purple" size={420} x="85%" y="70%" blur={130} />

      <div className="relative pt-28 pb-10 px-4 md:px-8">
        <div className="max-w-5xl mx-auto relative z-10 flex items-end justify-between gap-6">
          <div>
            <Badge className="mb-4 bg-white/5 text-muted-foreground border-white/10">
              <Settings className="w-3.5 h-3.5 mr-2 inline" />
              Réglages
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
                Compte
              </span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Personnalisez votre expérience {isArtist ? 'artiste' : 'auditeur'}.
            </p>
          </div>

          <Button
            onClick={saveAll}
            disabled={saving}
            className="rounded-full px-7 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 shadow-[0_0_25px_rgba(34,211,238,0.25)]"
            data-testid="settings-save"
          >
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 bg-white/5 border border-white/10 rounded-full p-1.5">
            <TabsTrigger value="account" className="rounded-full px-5 gap-2">
              <User className="w-4 h-4" /> Compte
            </TabsTrigger>
            <TabsTrigger value="audio" className="rounded-full px-5 gap-2">
              <Headphones className="w-4 h-4" /> Audio
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-full px-5 gap-2">
              <Bell className="w-4 h-4" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="rounded-full px-5 gap-2">
              <Shield className="w-4 h-4" /> Confidentialité
            </TabsTrigger>
            {roleTargetIsArtist && (
              <TabsTrigger value="artist" className="rounded-full px-5 gap-2">
                <Sparkles className="w-4 h-4" /> Artiste
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="account">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6">
              <Card className="glass-heavy rounded-3xl border-white/10">
                <CardHeader>
                  <CardTitle>Profil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom</Label>
                      <Input value={user.name || ''} disabled className="h-12 rounded-xl bg-white/5 border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user.email || ''} disabled className="h-12 rounded-xl bg-white/5 border-white/10" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-heavy rounded-3xl border-white/10">
                <CardHeader>
                  <CardTitle>Mode</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div>
                      <p className="font-medium">Activer le mode Artiste</p>
                      <p className="text-sm text-muted-foreground">
                        Publiez vos titres, suivez vos stats et gérez votre profil.
                      </p>
                    </div>
                    <Switch
                      checked={roleTargetIsArtist}
                      onCheckedChange={(v) => setRoleTargetIsArtist(!!v)}
                      data-testid="settings-role-switch"
                    />
                  </div>

                  {roleTargetIsArtist && (
                    <div className="space-y-2">
                      <Label>Nom d&apos;artiste</Label>
                      <Input
                        value={artistName}
                        onChange={(e) => setArtistName(e.target.value)}
                        placeholder="Votre nom de scène"
                        className="h-12 rounded-xl bg-white/5 border-white/10"
                        data-testid="settings-artist-name"
                      />
                      <p className="text-xs text-muted-foreground">
                        Requis pour activer le mode Artiste.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="audio">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6">
              <Card className="glass-heavy rounded-3xl border-white/10">
                <CardHeader>
                  <CardTitle>Lecture</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      key: 'autoplay',
                      title: 'Lecture automatique',
                      desc: "Lance automatiquement le prochain titre."
                    },
                    {
                      key: 'normalizeVolume',
                      title: 'Normaliser le volume',
                      desc: 'Réduit les écarts de volume entre les titres.'
                    },
                    {
                      key: 'highQualityStreaming',
                      title: 'Streaming haute qualité',
                      desc: 'Privilégie une meilleure qualité audio (plus de data).'
                    }
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
                    >
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={!!listenerSettings.playback[item.key]}
                        onCheckedChange={(v) =>
                          setListenerSettings((prev) => ({
                            ...prev,
                            playback: { ...prev.playback, [item.key]: !!v }
                          }))
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6">
              <Card className="glass-heavy rounded-3xl border-white/10">
                <CardHeader>
                  <CardTitle>Préférences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'newReleases', title: 'Nouvelles sorties', desc: 'Recevoir les nouveautés.' },
                    { key: 'recommendations', title: 'Recommandations', desc: 'Découvertes adaptées à vos goûts.' },
                    { key: 'purchases', title: 'Achats', desc: 'Suivi des achats et confirmations.' }
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
                    >
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={!!listenerSettings.notifications[item.key]}
                        onCheckedChange={(v) =>
                          setListenerSettings((prev) => ({
                            ...prev,
                            notifications: { ...prev.notifications, [item.key]: !!v }
                          }))
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="privacy">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6">
              <Card className="glass-heavy rounded-3xl border-white/10">
                <CardHeader>
                  <CardTitle>Données & confidentialité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      key: 'shareListeningActivity',
                      title: "Partager l'activité d'écoute",
                      desc: 'Affiche votre activité (likes, écoutes) sur votre profil.'
                    },
                    {
                      key: 'personalizedAds',
                      title: 'Personnalisation',
                      desc: 'Utiliser vos écoutes pour personnaliser le contenu.'
                    }
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
                    >
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={!!listenerSettings.privacy[item.key]}
                        onCheckedChange={(v) =>
                          setListenerSettings((prev) => ({
                            ...prev,
                            privacy: { ...prev.privacy, [item.key]: !!v }
                          }))
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {roleTargetIsArtist && (
            <TabsContent value="artist">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6">
                <Card className="glass-heavy rounded-3xl border-white/10">
                  <CardHeader>
                    <CardTitle>Profil artiste</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom affiché</Label>
                        <Input
                          value={artistProfile.name}
                          onChange={(e) => setArtistProfile((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Nom d'artiste"
                          className="h-12 rounded-xl bg-white/5 border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Avatar (URL)</Label>
                        <Input
                          value={artistProfile.avatar_url}
                          onChange={(e) => setArtistProfile((p) => ({ ...p, avatar_url: e.target.value }))}
                          placeholder="https://..."
                          className="h-12 rounded-xl bg-white/5 border-white/10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <Textarea
                        value={artistProfile.bio}
                        onChange={(e) => setArtistProfile((p) => ({ ...p, bio: e.target.value }))}
                        rows={5}
                        placeholder="Parlez de votre univers, influences, etc."
                        className="rounded-xl bg-white/5 border-white/10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Liens</Label>
                      <div className="space-y-2">
                        {(artistProfile.links || []).map((link, idx) => (
                          <div key={idx} className="flex gap-2">
                            <Input
                              value={link}
                              onChange={(e) =>
                                setArtistProfile((p) => ({
                                  ...p,
                                  links: p.links.map((l, i) => (i === idx ? e.target.value : l))
                                }))
                              }
                              placeholder="https://instagram.com/..."
                              className="h-12 rounded-xl bg-white/5 border-white/10"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-xl glass border-white/10"
                              onClick={() =>
                                setArtistProfile((p) => ({
                                  ...p,
                                  links: p.links.filter((_, i) => i !== idx).length
                                    ? p.links.filter((_, i) => i !== idx)
                                    : ['']
                                }))
                              }
                            >
                              Supprimer
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full glass border-white/10"
                        onClick={() => setArtistProfile((p) => ({ ...p, links: [...(p.links || []), ''] }))}
                      >
                        + Ajouter un lien
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AccountSettings;

