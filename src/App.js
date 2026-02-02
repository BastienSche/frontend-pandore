import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/Navbar';
import AudioPlayer from '@/components/AudioPlayer';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Browse from '@/pages/Browse';
import Library from '@/pages/Library';
import ArtistDashboard from '@/pages/ArtistDashboard';
import TrackDetail from '@/pages/TrackDetail';
import ArtistProfile from '@/pages/ArtistProfile';
import Playlists from '@/pages/Playlists';
import AlbumDetail from '@/pages/AlbumDetail';
import '@/App.css';

const ProtectedRoute = ({ children }) => {
  return children;
};

function AppRouter() {
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