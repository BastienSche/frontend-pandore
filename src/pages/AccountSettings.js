import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Save, Settings, User, Bell, Shield, Headphones, Sparkles, ImagePlus, Loader2 } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { apiClient, formatApiError, resolveApiUrl } from '@/lib/apiClient';
import { artistAvatarSrc } from '@/lib/artistAvatar';
import {
  defaultListenerSettings,
  emitSettingsChanged,
  loadLocalSettings,
  saveLocalSettings,
  settingsFromApi
} from '@/lib/accountSettings';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const AccountSettings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, switchRole, updateUser } = useAuth();
  const hydratedUserId = useRef(null);
  const profileHydratedId = useRef(null);

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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarDragOver, setAvatarDragOver] = useState(false);
  const avatarInputRef = useRef(null);
  const listenerAvatarInputRef = useRef(null);

  // Listener settings (local)
  const [listenerSettings, setListenerSettings] = useState(defaultListenerSettings);
  const [listenerPicture, setListenerPicture] = useState('');

  const isArtist = useMemo(() => user?.role === 'artist', [user?.role]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.user_id) {
      hydratedUserId.current = null;
      profileHydratedId.current = null;
      navigate('/login');
      return;
    }
    if (hydratedUserId.current === user.user_id) return;
    hydratedUserId.current = user.user_id;

    setRoleTargetIsArtist(user.role === 'artist');
    setArtistName(user.artist_name || '');
    setListenerPicture(user.picture || '');

    (async () => {
      try {
        const { data } = await apiClient.get('/api/users/me/settings');
        setListenerSettings(settingsFromApi(data));
      } catch {
        const local = loadLocalSettings();
        if (local) setListenerSettings({ ...defaultListenerSettings, ...local });
      }
    })();
  }, [authLoading, user?.user_id, navigate]);

  useEffect(() => {
    if (!user?.user_id || user.role !== 'artist') return;
    if (profileHydratedId.current === user.user_id) return;
    profileHydratedId.current = user.user_id;

    (async () => {
      try {
        const { data } = await apiClient.get('/api/artist/profile');
        setArtistProfile({
          name: data?.name || user.artist_name || user.name || '',
          bio: data?.bio || '',
          avatar_url: data?.avatar_url || '',
          links: (data?.links?.length ? data.links : ['']).map((l) => l || '')
        });
      } catch {
        setArtistProfile({
          name: user.artist_name || user.name || '',
          bio: '',
          avatar_url: '',
          links: ['']
        });
      }
    })();
  }, [user?.user_id, user?.role]);

  const applyRoleChange = async () => {
    if (!user) return;

    const wantsArtist = roleTargetIsArtist;
    if (wantsArtist) {
      const nextName = (artistName || user.artist_name || '').trim();
      if (!nextName) {
        toast.error("Le nom d'artiste est requis");
        return;
      }
      await switchRole('artist', nextName);
      toast.success('Mode Artiste activé');
      return;
    }

    await switchRole('user');
    toast.success('Mode Auditeur activé');
  };

  const uploadImageFile = async (file, onUrl) => {
    if (!file) return;
    if (!String(file.type || '').startsWith('image/')) {
      toast.error('Dépose une image (JPG, PNG, WebP…)');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image trop lourde (8 Mo max)');
      return;
    }
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await apiClient.post('/api/upload/cover', fd);
      const url = data?.cover_url || '';
      if (!url) throw new Error('missing cover url');
      onUrl(url);
      toast.success('Photo ajoutée — enregistre pour la publier');
    } catch (error) {
      toast.error(formatApiError(error, "Impossible d'envoyer l'image"));
    } finally {
      setAvatarUploading(false);
    }
  };

  const onAvatarDrop = (event) => {
    event.preventDefault();
    setAvatarDragOver(false);
    const file = event.dataTransfer?.files?.[0];
    uploadImageFile(file, (url) => setArtistProfile((prev) => ({ ...prev, avatar_url: url })));
  };

  const onListenerAvatarDrop = (event) => {
    event.preventDefault();
    setAvatarDragOver(false);
    const file = event.dataTransfer?.files?.[0];
    uploadImageFile(file, setListenerPicture);
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

    try {
      await apiClient.put('/api/artist/profile', payload);
    } catch (error) {
      if (error?.response?.status === 404) {
        await apiClient.post('/api/artist/profile', payload);
      } else {
        throw error;
      }
    }
    setArtistName(payload.name);
    updateUser({ artist_name: payload.name });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const alreadyArtist = user?.role === 'artist';
      const nextName = artistName.trim();
      const roleChanged = roleTargetIsArtist !== alreadyArtist;
      const artistNameChanged = roleTargetIsArtist && nextName && nextName !== (user?.artist_name || '');
      if (roleChanged || artistNameChanged) {
        await applyRoleChange();
      }
      if ((listenerPicture || '') !== (user?.picture || '')) {
        const { data } = await apiClient.put('/api/users/me', { picture: listenerPicture || '' });
        if (data) updateUser(data);
      }
      saveLocalSettings(listenerSettings);
      emitSettingsChanged(listenerSettings);
      await apiClient.put('/api/users/me/settings', {
        autoplay: !!listenerSettings.playback.autoplay,
        normalize_volume: !!listenerSettings.playback.normalizeVolume,
        high_quality_streaming: !!listenerSettings.playback.highQualityStreaming,
        notifications_new_releases: !!listenerSettings.notifications.newReleases,
        notifications_recommendations: !!listenerSettings.notifications.recommendations,
        notifications_purchases: !!listenerSettings.notifications.purchases,
        notifications_likes: !!listenerSettings.notifications.likes,
        privacy_share_listening_activity: !!listenerSettings.privacy.shareListeningActivity,
        privacy_personalized_ads: !!listenerSettings.privacy.personalizedAds
      });
      if (roleTargetIsArtist) {
        await saveArtistProfile();
      }
      toast.success('Réglages enregistrés');
    } catch (error) {
      toast.error(formatApiError(error, "Erreur lors de l'enregistrement"));
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
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
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
            className="rounded-full px-7 w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 shadow-[0_0_25px_rgba(34,211,238,0.25)]"
            data-testid="settings-save"
          >
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-8 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="bg-white/5 border border-white/10 rounded-full p-1.5 w-max min-w-full sm:min-w-0">
            <TabsTrigger value="account" className="rounded-full px-3 sm:px-5 gap-2">
              <User className="w-4 h-4" /> Compte
            </TabsTrigger>
            <TabsTrigger value="audio" className="rounded-full px-3 sm:px-5 gap-2">
              <Headphones className="w-4 h-4" /> Audio
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-full px-3 sm:px-5 gap-2">
              <Bell className="w-4 h-4" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="rounded-full px-3 sm:px-5 gap-2">
              <Shield className="w-4 h-4" /> Confidentialité
            </TabsTrigger>
            {roleTargetIsArtist && (
              <TabsTrigger value="artist" className="rounded-full px-3 sm:px-5 gap-2">
                <Sparkles className="w-4 h-4" /> Artiste
              </TabsTrigger>
            )}
            </TabsList>
          </div>

          <TabsContent value="account">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6">
              <Card className="glass-heavy rounded-3xl border-white/10">
                <CardHeader>
                  <CardTitle>Profil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Photo</Label>
                    <button
                      type="button"
                      onClick={() => listenerAvatarInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setAvatarDragOver(true);
                      }}
                      onDragLeave={() => setAvatarDragOver(false)}
                      onDrop={onListenerAvatarDrop}
                      disabled={avatarUploading}
                      className={`group flex items-center gap-4 rounded-2xl border border-dashed px-4 py-3 text-left transition-colors ${
                        avatarDragOver
                          ? 'border-cyan-400 bg-cyan-500/10'
                          : 'border-white/15 bg-white/5 hover:border-cyan-400/40 hover:bg-white/[0.07]'
                      }`}
                      data-testid="listener-avatar-dropzone"
                    >
                      <span className="relative w-16 h-16 rounded-full overflow-hidden border border-white/15 shrink-0 bg-black/30">
                        {listenerPicture || user?.picture ? (
                          <img
                            src={artistAvatarSrc({
                              picture: listenerPicture || user?.picture,
                              user_id: user?.user_id
                            })}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-lg text-muted-foreground">
                            {(user.name || user.email || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                        {avatarUploading && (
                          <span className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-cyan-300" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <ImagePlus className="w-4 h-4 text-cyan-300" />
                          Ajouter une photo
                        </span>
                        <span className="block text-xs text-muted-foreground mt-1">
                          JPG, PNG, WebP · 8 Mo max
                        </span>
                      </span>
                    </button>
                    <input
                      ref={listenerAvatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        uploadImageFile(e.target.files?.[0], setListenerPicture);
                        e.target.value = '';
                      }}
                    />
                    {listenerPicture ? (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setListenerPicture('')}
                      >
                        Retirer la photo
                      </button>
                    ) : null}
                  </div>
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
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

                  {roleTargetIsArtist && !String(user.artist_name || '').trim() && (
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
                        Une seule fois — tu pourras le changer ensuite dans l’onglet Artiste.
                      </p>
                    </div>
                  )}
                  {roleTargetIsArtist && String(user.artist_name || '').trim() && (
                    <p className="text-sm text-muted-foreground">
                      Pseudo actuel : <span className="text-foreground font-medium">{user.artist_name}</span>
                      {' — '}modifiable dans l’onglet Artiste.
                    </p>
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
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
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
                    { key: 'newReleases', title: 'Nouvelles sorties', desc: 'Quand un artiste que tu suis ou que tu aimes publie un titre ou un album.' },
                    { key: 'likes', title: 'Likes', desc: 'Quand quelqu’un aime un de tes titres, un album, ou ton profil.' },
                    { key: 'purchases', title: 'Achats', desc: 'Quand quelqu’un achète ou ajoute gratuitement un de tes sons.' },
                    { key: 'recommendations', title: 'Recommandations', desc: 'Découvertes adaptées à vos goûts.' }
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
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
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
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
                    <div className="grid md:grid-cols-[auto_1fr] gap-4 items-start">
                      <div className="space-y-2">
                        <Label>Avatar</Label>
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setAvatarDragOver(true);
                          }}
                          onDragLeave={() => setAvatarDragOver(false)}
                          onDrop={onAvatarDrop}
                          disabled={avatarUploading}
                          className={`group flex items-center gap-4 rounded-2xl border border-dashed px-4 py-3 text-left transition-colors ${
                            avatarDragOver
                              ? 'border-cyan-400 bg-cyan-500/10'
                              : 'border-white/15 bg-white/5 hover:border-cyan-400/40 hover:bg-white/[0.07]'
                          }`}
                          data-testid="artist-avatar-dropzone"
                        >
                          <span className="relative w-16 h-16 rounded-full overflow-hidden border border-white/15 shrink-0 bg-black/30">
                            <img
                              src={artistAvatarSrc({
                                avatar_url: artistProfile.avatar_url,
                                user_id: user?.user_id,
                                picture: user?.picture,
                                artist_name: artistProfile.name || user?.artist_name
                              })}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            {avatarUploading && (
                              <span className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-cyan-300" />
                              </span>
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-2 text-sm font-medium">
                              <ImagePlus className="w-4 h-4 text-cyan-300" />
                              Glisse une image
                            </span>
                            <span className="block text-xs text-muted-foreground mt-1">
                              ou clique pour choisir · JPG, PNG, WebP · 8 Mo max
                            </span>
                          </span>
                        </button>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            uploadImageFile(e.target.files?.[0], (url) =>
                              setArtistProfile((p) => ({ ...p, avatar_url: url }))
                            );
                            e.target.value = '';
                          }}
                        />
                        {artistProfile.avatar_url ? (
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setArtistProfile((p) => ({ ...p, avatar_url: '' }))}
                          >
                            Revenir au masque par défaut
                          </button>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label>Nom d&apos;artiste</Label>
                        <Input
                          value={artistProfile.name}
                          onChange={(e) => setArtistProfile((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Nom d'artiste"
                          className="h-12 rounded-xl bg-white/5 border-white/10"
                        />
                        <p className="text-xs text-muted-foreground">
                          C’est ton pseudo public. Tu peux le changer ici, pas à chaque passage en mode Artiste.
                        </p>
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
                          <div key={idx} className="flex flex-col sm:flex-row gap-2">
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
                              className="rounded-xl glass border-white/10 w-full sm:w-auto"
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

