import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Save, Settings, User, Bell, Shield, Headphones, Sparkles, ImagePlus, Loader2, Check, Mic } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { apiClient, formatApiError, resolveApiUrl } from '@/lib/apiClient';
import {
  artistAvatarSrc,
  DEFAULT_ARTIST_AVATARS,
  defaultArtistAvatar,
  isMaskAvatar,
  maskAvatarMatches
} from '@/lib/artistAvatar';
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
import { emptySmartLink, normalizeSmartLinks, publicPageUrl, SMART_LINK_KINDS } from '@/lib/smartLinks';
import ShareButton from '@/components/ShareButton';
import StripeConnectSection from '@/components/StripeConnectSection';

const SETTINGS_TABS = new Set(['account', 'audio', 'notifications', 'privacy', 'artist']);

const AccountSettings = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading, switchRole, updateUser } = useAuth();
  const hydratedUserId = useRef(null);
  const profileHydratedId = useRef(null);

  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return SETTINGS_TABS.has(tab) ? tab : 'account';
  });
  const [saving, setSaving] = useState(false);

  const [artistName, setArtistName] = useState('');
  const [becomingArtist, setBecomingArtist] = useState(false);

  // Artist profile (backend)
  const [artistProfile, setArtistProfile] = useState({
    name: '',
    bio: '',
    avatar_url: '',
    links: [emptySmartLink()],
    genres: ''
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
    const tab = searchParams.get('tab');
    const next = SETTINGS_TABS.has(tab) ? tab : 'account';
    if (next === 'artist' && !isArtist) {
      setActiveTab('account');
      return;
    }
    setActiveTab(next);
  }, [searchParams, isArtist]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    if (!tab || tab === 'account') next.delete('tab');
    else next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

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
          links: normalizeSmartLinks(data?.links).length ? normalizeSmartLinks(data?.links) : [emptySmartLink()],
          genres: Array.isArray(data?.genres) ? data.genres.join(', ') : ''
        });
      } catch {
        setArtistProfile({
          name: user.artist_name || user.name || '',
          bio: '',
          avatar_url: '',
          links: [emptySmartLink()],
          genres: ''
        });
      }
    })();
  }, [user?.user_id, user?.role]);

  const becomeArtist = async () => {
    if (!user || user.role === 'artist') return;
    const nextName = (artistName || user.name || '').trim();
    if (!nextName) {
      toast.error("Le nom d'artiste est requis");
      return;
    }
    setBecomingArtist(true);
    try {
      await switchRole('artist', nextName);
      setArtistProfile((prev) => ({ ...prev, name: nextName || prev.name }));
      toast.success('Compte artiste activé');
      navigate('/settings?tab=artist');
    } catch (error) {
      toast.error(formatApiError(error, "Impossible de devenir artiste"));
    } finally {
      setBecomingArtist(false);
    }
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
      links: normalizeSmartLinks(artistProfile.links),
      genres: String(artistProfile.genres || '')
        .split(/[,;/]+/)
        .map((g) => g.trim())
        .filter(Boolean)
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
    updateUser({ artist_name: payload.name, avatar_url: payload.avatar_url || '' });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
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
      if (isArtist) {
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
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
            {isArtist && (
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

              {!isArtist ? (
                <Card className="glass-heavy rounded-3xl border-white/10">
                  <CardHeader>
                    <CardTitle>Devenir artiste</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Tu publieras tes titres, suivras tes stats et géreras ton profil. Le rôle se choisit
                      à l’inscription, ou ici — sans revenir en arrière.
                    </p>
                    <div className="space-y-2">
                      <Label>Nom d&apos;artiste</Label>
                      <Input
                        value={artistName}
                        onChange={(e) => setArtistName(e.target.value)}
                        placeholder="Ton nom de scène"
                        className="h-12 rounded-xl bg-white/5 border-white/10"
                        data-testid="settings-artist-name"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={becomeArtist}
                      disabled={becomingArtist}
                      className="rounded-full px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 border-0"
                      data-testid="settings-become-artist"
                    >
                      {becomingArtist ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Mic className="w-4 h-4 mr-2" />
                      )}
                      Devenir artiste
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="glass-heavy rounded-3xl border-white/10">
                  <CardHeader>
                    <CardTitle>Compte artiste</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Tu es artiste
                      {user.artist_name ? (
                        <>
                          {' '}
                          sous le nom{' '}
                          <span className="text-foreground font-medium">{user.artist_name}</span>
                        </>
                      ) : null}
                      . Le pseudo se change dans l’onglet Artiste.
                    </p>
                  </CardContent>
                </Card>
              )}
              {isArtist ? <StripeConnectSection returnTo="settings" testId="settings-stripe-connect" /> : null}
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

          {isArtist && (
            <TabsContent value="artist">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6">
                <StripeConnectSection returnTo="settings" testId="settings-stripe-connect-artist" />
                <Card className="glass-heavy rounded-3xl border-white/10">
                  <CardHeader>
                    <CardTitle>Profil artiste</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-[auto_1fr] gap-4 items-start">
                      <div className="space-y-3">
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
                              Glisse une photo
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
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Ou choisis un masque Kloud</p>
                          <div className="flex flex-wrap gap-2" data-testid="artist-avatar-mask-grid">
                            {DEFAULT_ARTIST_AVATARS.map((mask, index) => {
                              const assignedDefault = defaultArtistAvatar(user?.user_id);
                              const current = artistProfile.avatar_url || assignedDefault;
                              const selected =
                                !artistProfile.avatar_url || isMaskAvatar(artistProfile.avatar_url)
                                  ? maskAvatarMatches(current, mask)
                                  : false;
                              return (
                                <button
                                  key={mask}
                                  type="button"
                                  onClick={() => setArtistProfile((p) => ({ ...p, avatar_url: mask }))}
                                  className={`relative w-12 h-12 rounded-full overflow-hidden border transition-all ${
                                    selected
                                      ? 'border-cyan-400 ring-2 ring-cyan-400/40 scale-105'
                                      : 'border-white/15 hover:border-cyan-400/50 hover:scale-105'
                                  }`}
                                  aria-label={`Masque ${index + 1}`}
                                  aria-pressed={selected}
                                  data-testid={`artist-avatar-mask-${index + 1}`}
                                >
                                  <img src={mask} alt="" className="w-full h-full object-cover" />
                                  {selected && (
                                    <span className="absolute inset-0 bg-cyan-500/25 flex items-center justify-center">
                                      <Check className="w-4 h-4 text-white drop-shadow" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        {artistProfile.avatar_url &&
                        artistProfile.avatar_url !== defaultArtistAvatar(user?.user_id) ? (
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setArtistProfile((p) => ({ ...p, avatar_url: '' }))}
                          >
                            Revenir au masque attribué
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
                      <Label>Genres</Label>
                      <Input
                        value={artistProfile.genres}
                        onChange={(e) => setArtistProfile((p) => ({ ...p, genres: e.target.value }))}
                        placeholder="Rap, Lo-fi, Électro…"
                        className="h-12 rounded-xl bg-white/5 border-white/10"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Smart links</Label>
                      <p className="text-xs text-muted-foreground">
                        Instagram, pre-save, Spotify… Ils s’affichent sur ta page publique, avec un QR pour la partager.
                      </p>
                      <div className="space-y-3">
                        {(artistProfile.links || []).map((link, idx) => (
                          <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <select
                              value={link.kind || 'website'}
                              onChange={(e) =>
                                setArtistProfile((p) => ({
                                  ...p,
                                  links: p.links.map((l, i) => (i === idx ? { ...l, kind: e.target.value } : l))
                                }))
                              }
                              className="sm:col-span-3 h-12 min-h-12 rounded-xl bg-white/5 border border-white/10 px-3 text-sm"
                            >
                              {SMART_LINK_KINDS.map((kind) => (
                                <option key={kind.id} value={kind.id}>
                                  {kind.label}
                                </option>
                              ))}
                            </select>
                            <div className="sm:col-span-6 min-w-0">
                              <Input
                                value={link.url || ''}
                                onChange={(e) =>
                                  setArtistProfile((p) => ({
                                    ...p,
                                    links: p.links.map((l, i) => (i === idx ? { ...l, url: e.target.value } : l))
                                  }))
                                }
                                placeholder={SMART_LINK_KINDS.find((k) => k.id === link.kind)?.placeholder || 'https://…'}
                                className="h-12 min-h-12 rounded-xl bg-white/5 border-white/10"
                              />
                            </div>
                            <div className="sm:col-span-3 min-w-0">
                              <Input
                                value={link.label || ''}
                                onChange={(e) =>
                                  setArtistProfile((p) => ({
                                    ...p,
                                    links: p.links.map((l, i) => (i === idx ? { ...l, label: e.target.value } : l))
                                  }))
                                }
                                placeholder="Libellé"
                                className="h-12 min-h-12 rounded-xl bg-white/5 border-white/10"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-xl glass border-white/10 sm:col-span-12"
                              onClick={() =>
                                setArtistProfile((p) => ({
                                  ...p,
                                  links: p.links.filter((_, i) => i !== idx).length
                                    ? p.links.filter((_, i) => i !== idx)
                                    : [emptySmartLink()]
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
                        onClick={() =>
                          setArtistProfile((p) => ({ ...p, links: [...(p.links || []), emptySmartLink()] }))
                        }
                      >
                        + Ajouter un smart link
                      </Button>
                    </div>

                    {user?.user_id && (
                      <div className="pt-2 space-y-3">
                        <Label>Partage de ta page</Label>
                        <ShareButton
                          url={publicPageUrl(`/artist/${user.user_id}`)}
                          title={artistProfile.name || user.artist_name || 'Kloud'}
                          text={`Écoute ${artistProfile.name || 'cet artiste'} sur Kloud`}
                          label="Partager ma page"
                          testId="settings-share-artist"
                        />
                      </div>
                    )}
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

