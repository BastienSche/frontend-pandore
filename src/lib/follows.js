import { apiClient } from '@/lib/apiClient';

export async function fetchFollowState(artistIds) {
  if (!artistIds?.length) return {};
  const { data } = await apiClient.get('/api/follows/state', {
    params: { artist_ids: artistIds.join(',') }
  });
  return data || {};
}

export async function followArtist(artistId) {
  const { data } = await apiClient.post('/api/follows', { artist_id: artistId });
  return data;
}

export async function unfollowArtist(artistId) {
  const { data } = await apiClient.delete('/api/follows', { params: { artist_id: artistId } });
  return data;
}

/** Liste des artistes suivis (`GET /api/follows`). */
export async function fetchMyFollows(limit = 200) {
  const { data } = await apiClient.get('/api/follows', { params: { limit } });
  return Array.isArray(data) ? data : [];
}

