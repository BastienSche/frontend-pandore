import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { apiClient } from '@/lib/apiClient';

const SESSION_KEY = 'kloud_analytics_sid';
const INTERVAL_MS = 25000;

function getSessionId() {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = `s_${crypto.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`}`;
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return `s_${Date.now().toString(36)}`;
  }
}

function pathArtistId(pathname) {
  const m = String(pathname || '').match(/^\/artist\/([^/]+)/);
  return m ? m[1] : null;
}

function pathTrackId(pathname) {
  const m = String(pathname || '').match(/^\/track\/([^/]+)/);
  return m ? m[1] : null;
}

function pathAlbumId(pathname) {
  const m = String(pathname || '').match(/^\/album\/([^/]+)/);
  return m ? m[1] : null;
}

const AnalyticsTracker = () => {
  const location = useLocation();
  const { currentTrack, isPlaying } = useAudioPlayer();
  const lastSentRef = useRef(Date.now());
  const locRef = useRef(location);
  const trackRef = useRef({ currentTrack, isPlaying });

  locRef.current = location;
  trackRef.current = { currentTrack, isPlaying };

  useEffect(() => {
    const send = (opts = {}) => {
      const now = Date.now();
      const dwellSec = Math.max(0, Math.min(120, Math.round((now - lastSentRef.current) / 1000)));
      lastSentRef.current = now;
      const loc = locRef.current;
      const playing = trackRef.current;
      const path = `${loc.pathname || '/'}${loc.search || ''}`;
      const payload = {
        session_id: getSessionId(),
        path,
        referrer: typeof document !== 'undefined' ? document.referrer.slice(0, 400) : '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        locale: (typeof navigator !== 'undefined' && navigator.language) || '',
        artist_id: playing.currentTrack?.artist_id || pathArtistId(loc.pathname),
        track_id: playing.isPlaying ? playing.currentTrack?.track_id : pathTrackId(loc.pathname),
        album_id: pathAlbumId(loc.pathname),
        dwell_sec: opts.dwell ?? dwellSec,
        local_hour: new Date().getHours(),
        visible: typeof document === 'undefined' ? true : document.visibilityState === 'visible'
      };
      apiClient.post('/api/analytics/heartbeat', payload).catch(() => {});
    };

    send({ dwell: 0 });
    const timer = window.setInterval(send, INTERVAL_MS);

    const onVis = () => {
      if (document.visibilityState === 'hidden') send();
      else lastSentRef.current = Date.now();
    };
    const onHide = () => send();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onHide);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onHide);
    };
  }, []);

  useEffect(() => {
    lastSentRef.current = Date.now();
    const loc = location;
    const playing = trackRef.current;
    apiClient
      .post('/api/analytics/heartbeat', {
        session_id: getSessionId(),
        path: `${loc.pathname || '/'}${loc.search || ''}`,
        referrer: typeof document !== 'undefined' ? document.referrer.slice(0, 400) : '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        locale: (typeof navigator !== 'undefined' && navigator.language) || '',
        artist_id: playing.currentTrack?.artist_id || pathArtistId(loc.pathname),
        track_id: playing.isPlaying ? playing.currentTrack?.track_id : pathTrackId(loc.pathname),
        album_id: pathAlbumId(loc.pathname),
        dwell_sec: 0,
        local_hour: new Date().getHours(),
        visible: true
      })
      .catch(() => {});
  }, [location.pathname, location.search]);

  return null;
};

export default AnalyticsTracker;
