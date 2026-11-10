/** @returns {Promise<{ trackIds: Set<string>, albumIds: Set<string> }>} */
export async function getLibraryOwnership(apiClient) {
  const { data } = await apiClient.get('/api/purchases/library');
  const tracks = data?.tracks || [];
  const albums = data?.albums || [];
  const trackIds = new Set(tracks.map((t) => t.track_id).filter(Boolean));
  const albumIds = new Set(albums.map((a) => a.album_id).filter(Boolean));
  albums.forEach((album) => {
    (album.track_ids || []).forEach((id) => {
      if (id) trackIds.add(id);
    });
  });
  tracks.forEach((track) => {
    if (track.album_id && albumIds.has(track.album_id) && track.track_id) {
      trackIds.add(track.track_id);
    }
  });
  return { trackIds, albumIds };
}
