export const LS_KEY = 'kloud_account_settings';
export const LEGACY_LS_KEY = 'pandore_account_settings';
export const SETTINGS_CHANGED_EVENT = 'kloud-settings-changed';

export const defaultListenerSettings = {
  playback: {
    autoplay: true,
    normalizeVolume: true,
    highQualityStreaming: true
  },
  notifications: {
    newReleases: true,
    recommendations: true,
    purchases: true,
    likes: true
  },
  privacy: {
    shareListeningActivity: false,
    personalizedAds: false
  }
};

export function loadLocalSettings() {
  try {
    const raw = window.localStorage.getItem(LS_KEY) || window.localStorage.getItem(LEGACY_LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocalSettings(value) {
  window.localStorage.setItem(LS_KEY, JSON.stringify(value));
  window.localStorage.setItem(LEGACY_LS_KEY, JSON.stringify(value));
}

export function settingsFromApi(data) {
  return {
    playback: {
      autoplay: data?.autoplay ?? true,
      normalizeVolume: data?.normalize_volume ?? true,
      highQualityStreaming: data?.high_quality_streaming ?? true
    },
    notifications: {
      newReleases: data?.notifications_new_releases ?? true,
      recommendations: data?.notifications_recommendations ?? true,
      purchases: data?.notifications_purchases ?? true,
      likes: data?.notifications_likes ?? true
    },
    privacy: {
      shareListeningActivity: data?.privacy_share_listening_activity ?? false,
      personalizedAds: data?.privacy_personalized_ads ?? false
    }
  };
}

export function emitSettingsChanged(settings) {
  window.dispatchEvent(new CustomEvent(SETTINGS_CHANGED_EVENT, { detail: settings }));
}

export function readPlayerPrefs(settings) {
  const src = settings || loadLocalSettings() || defaultListenerSettings;
  return {
    autoplay: src?.playback?.autoplay !== false,
    normalizeVolume: src?.playback?.normalizeVolume !== false,
    highQualityStreaming: src?.playback?.highQualityStreaming !== false,
    shareListeningActivity: !!src?.privacy?.shareListeningActivity,
    personalizedAds: !!src?.privacy?.personalizedAds
  };
}
