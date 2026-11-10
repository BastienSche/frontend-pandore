export const TOUR_EVENT = 'kloud-tour-changed';

const storageKey = (userId) => `kloud:tour:${userId}`;

export const PRODUCT_TOURS = {
  artist: [
    {
      id: 'bio',
      path: '/settings?tab=artist',
      target: 'artist-bio',
      text: 'Ici tu présentes ton univers.',
      stay: true
    },
    {
      id: 'dashboard',
      path: '/artist-dashboard',
      target: 'artist-dashboard',
      text: 'Ici tu publies un titre.'
    },
    {
      id: 'connect',
      path: '/artist-dashboard',
      target: 'artist-connect',
      text: 'Ici tu actives Stripe.'
    },
    {
      id: 'browse',
      path: '/browse',
      target: 'browse-discover',
      text: 'Ici on te trouve.',
      stay: true
    }
  ],
  listener: [
    {
      id: 'browse',
      path: '/browse',
      target: 'browse-discover',
      text: 'Ici tu cherches un son.',
      stay: true
    },
    {
      id: 'buy',
      path: '/browse',
      target: 'browse-buy',
      text: 'Ici tu achètes un titre.'
    },
    {
      id: 'playlists',
      path: '/playlists',
      target: 'playlists',
      text: 'Ici tu crées ta playlist.'
    }
  ]
};

const readState = (userId) => {
  if (!userId) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeState = (userId, state) => {
  if (!userId) return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(TOUR_EVENT));
};

export const getProductTourState = (userId) => {
  const state = readState(userId);
  if (!state || state.status !== 'active') return null;
  const steps = PRODUCT_TOURS[state.role];
  if (!steps?.length) return null;
  const index = Math.max(0, Math.min(Number(state.step) || 0, steps.length - 1));
  return { ...state, step: index, steps, current: steps[index] };
};

export const startProductTour = (role, userId) => {
  if (!userId || !PRODUCT_TOURS[role]) return;
  writeState(userId, { role, step: 0, status: 'active' });
};

export const advanceProductTour = (userId) => {
  const state = getProductTourState(userId);
  if (!state) return;
  const next = state.step + 1;
  if (next >= state.steps.length) {
    writeState(userId, { ...state, status: 'done', step: state.step });
    return;
  }
  writeState(userId, { role: state.role, step: next, status: 'active' });
};

export const skipProductTour = (userId) => {
  const state = readState(userId) || {};
  writeState(userId, { ...state, status: 'done' });
};
