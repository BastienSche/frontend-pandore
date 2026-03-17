import { apiClient } from '@/lib/apiClient';

export async function fetchLikeState(itemType, ids) {
  if (!ids?.length) return {};
  const { data } = await apiClient.get('/api/likes/state', {
    params: { item_type: itemType, ids: ids.join(',') }
  });
  return data || {};
}

export async function like(itemType, itemId) {
  const { data } = await apiClient.post('/api/likes', { item_type: itemType, item_id: itemId });
  return data;
}

export async function unlike(itemType, itemId) {
  const { data } = await apiClient.delete('/api/likes', { params: { item_type: itemType, item_id: itemId } });
  return data;
}

