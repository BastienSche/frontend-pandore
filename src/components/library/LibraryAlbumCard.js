import React, { useState, useEffect } from 'react';
import { Disc, Heart, ListMusic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { fetchLikeState, like, unlike } from '@/lib/likes';
import { heartIconActiveClass } from '@/lib/heartIconClass';

const LibraryAlbumCard = ({ album, onPlayAlbum, playingAlbumId }) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const loading = playingAlbumId === album.album_id;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const state = await fetchLikeState('album', [album.album_id]);
        if (mounted) setLiked(!!state?.[album.album_id]);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [album.album_id]);

  const toggleLike = async (e) => {
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    try {
      if (next) await like('album', album.album_id);
      else await unlike('album', album.album_id);
    } catch {
      setLiked(!next);
    }
  };

  const n = album.track_ids?.length ?? 0;

  return (
    <div
      className="group relative rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-purple-500/30 transition-colors"
      data-testid={`library-album-card-${album.album_id}`}
    >
      <div
        className="relative aspect-square cursor-pointer"
        onClick={() => navigate(`/library/albums/${album.album_id}`)}
      >
        {album.cover_url && !coverError ? (
          <img
            src={album.cover_url}
            alt={album.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setCoverError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500/25 via-pink-500/15 to-orange-500/20 flex items-center justify-center">
            <Disc className="w-16 h-16 text-white/25" />
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2">
          <p className="font-semibold text-white text-sm md:text-base line-clamp-2 [text-shadow:0_1px_3px_rgba(0,0,0,0.95),0_0_12px_rgba(0,0,0,0.6)]">
            {album.title}
          </p>
          <p className="text-xs text-white/90 line-clamp-1 [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
            {album.artist_name}
          </p>
        </div>
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-sm px-2.5 py-1 text-[11px] text-white/95 border border-white/10">
          <ListMusic className="w-3.5 h-3.5" />
          {n} titre{n > 1 ? 's' : ''}
        </div>
      </div>

      <div className="p-3 flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0"
          disabled={loading || n === 0}
          onClick={(e) => {
            e.stopPropagation();
            onPlayAlbum(album);
          }}
          data-testid={`library-album-play-${album.album_id}`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Disc className="w-4 h-4 mr-2" />
              Lire l&apos;album
            </>
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full shrink-0 hover:bg-pink-500/10"
          onClick={toggleLike}
          data-testid={`library-album-like-${album.album_id}`}
        >
          <Heart className={`w-4 h-4 ${heartIconActiveClass(liked)}`} />
        </Button>
      </div>
    </div>
  );
};

export default LibraryAlbumCard;
