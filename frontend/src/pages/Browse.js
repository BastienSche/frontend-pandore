import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Disc, Music } from 'lucide-react';
import TrackCard from '@/components/TrackCard';
import AlbumCard from '@/components/AlbumCard';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Browse = () => {
  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tracksRes, albumsRes] = await Promise.all([
        axios.get(`${API}/tracks`),
        axios.get(`${API}/albums`)
      ]);
      setTracks(tracksRes.data);
      setAlbums(albumsRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const filteredTracks = tracks.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAlbums = albums.filter(album =>
    album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    album.artist_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-32">
      <div className="bg-gradient-to-br from-primary/20 via-background to-background py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6" data-testid="browse-title">
            Découvrir
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Explorez les dernières sorties et trouvez votre prochaine musique préférée
          </p>
          
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher des titres, albums ou artistes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 rounded-full text-base"
              data-testid="browse-search-input"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <Tabs defaultValue="tracks" className="w-full">
          <TabsList className="mb-8" data-testid="browse-tabs">
            <TabsTrigger value="tracks" className="gap-2" data-testid="tracks-tab">
              <Music className="w-4 h-4" />
              Titres ({filteredTracks.length})
            </TabsTrigger>
            <TabsTrigger value="albums" className="gap-2" data-testid="albums-tab">
              <Disc className="w-4 h-4" />
              Albums ({filteredAlbums.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracks" data-testid="tracks-grid">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : filteredTracks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredTracks.map(track => (
                  <TrackCard key={track.track_id} track={track} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aucun titre trouvé</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="albums" data-testid="albums-grid">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : filteredAlbums.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredAlbums.map(album => (
                  <AlbumCard key={album.album_id} album={album} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aucun album trouvé</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Browse;