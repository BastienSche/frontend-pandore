import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import AudioPlayer from '@/components/AudioPlayer';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import AuthCallback from '@/pages/AuthCallback';
import Browse from '@/pages/Browse';
import Library from '@/pages/Library';
import ArtistDashboard from '@/pages/ArtistDashboard';
import TrackDetail from '@/pages/TrackDetail';
import ArtistProfile from '@/pages/ArtistProfile';
import Playlists from '@/pages/Playlists';
import AlbumDetail from '@/pages/AlbumDetail';
import '@/App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // If passed user from AuthCallback, render immediately
  if (location.state?.user) {
    return children;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment (not query params) for session_id
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
          path="/playlists"
          element={
            <ProtectedRoute>
              <Playlists />
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
          <Toaster position="top-center" />
        </div>
      </AudioPlayerProvider>
    </ThemeProvider>
  );
}

export default App;