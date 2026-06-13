import { apiClient } from '@/lib/apiClient';

/** Enregistre une écoute côté API (stats artiste). Échecs silencieux. */
export function recordTrackPlay(trackId, durationSec = 15) {
  if (!trackId) return;
  const d = Math.max(1, Math.min(7200, Math.round(Number(durationSec) || 15)));
  apiClient.post('/api/plays', null, { params: { track_id: trackId, duration_sec: d } }).catch(() => {});
}
