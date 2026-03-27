/** @returns {Promise<{ trackIds: Set<string>, albumIds: Set<string> }>} */
export async function getLibraryOwnership(apiClient) {
  const { data } = await apiClient.get('/api/purchases/library');
  const trackIds = new Set((data?.tracks || []).map((t) => t.track_id));
  const albumIds = new Set((data?.albums || []).map((a) => a.album_id));
  return { trackIds, albumIds };
}
