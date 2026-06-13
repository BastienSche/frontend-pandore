import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/Navbar';
import AudioPlayer from '@/components/AudioPlayer';
import { useAuth } from '@/hooks/useAuth';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Browse from '@/pages/Browse';
import Library from '@/pages/Library';
import LibraryTrackOwned from '@/pages/LibraryTrackOwned';
import LibraryAlbumOwned from '@/pages/LibraryAlbumOwned';
import ArtistDashboard from '@/pages/ArtistDashboard';
import TrackDetail from '@/pages/TrackDetail';
import ArtistProfile from '@/pages/ArtistProfile';
import Playlists from '@/pages/Playlists';
import AlbumDetail from '@/pages/AlbumDetail';
import AccountSettings from '@/pages/AccountSettings';
import PlaylistDetail from '@/pages/PlaylistDetail';
import AuthCallback from '@/pages/AuthCallback';
import UiKit from '@/pages/UiKit';
import NousDecouvrir from '@/pages/NousDecouvrir';
import AdminDashboard from '@/pages/AdminDashboard';
import '@/App.css';

const ProtectedRoute = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

function AppRouter() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ui" element={<UiKit />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/nous-decouvrir" element={<NousDecouvrir />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/browse"
          element={
            <ProtectedRoute>
              <Browse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <Library />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library/tracks/:trackId"
          element={
            <ProtectedRoute>
              <LibraryTrackOwned />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library/albums/:albumId"
          element={
            <ProtectedRoute>
              <LibraryAlbumOwned />
            </ProtectedRoute>
          }
        />
        <Route
          path="/artist-dashboard"
          element={
            <ProtectedRoute>
              <ArtistDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/track/:trackId" element={<TrackDetail />} />
        <Route path="/album/:albumId" element={<AlbumDetail />} />
        <Route path="/artist/:artistId" element={<ArtistProfile />} />
        <Route
          path="/playlist/:playlistId"
          element={
            <ProtectedRoute>
              <PlaylistDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/playlists"
          element={
            <ProtectedRoute>
              <Playlists />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AudioPlayer />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AudioPlayerProvider>
        <div className="App">
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
          <Toaster />
        </div>
      </AudioPlayerProvider>
    </ThemeProvider>
  );
}

export default App;