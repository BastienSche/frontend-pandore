import React, { useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/Navbar';
import AudioPlayer from '@/components/AudioPlayer';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
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
import Concours from '@/pages/Concours';
import LegalDocument from '@/pages/LegalDocument';
import Contact from '@/pages/Contact';
import Help from '@/pages/Help';
import NotFound from '@/pages/NotFound';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import ContestAnnounceModal from '@/components/ContestAnnounceModal';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import SiteFooter from '@/components/SiteFooter';
import CookieBanner from '@/components/CookieBanner';
import ProductTour from '@/components/ProductTour';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ARTIST_ONBOARDING_PATH, consumePostLoginPath, rememberPostLoginPath, safeInternalPath } from '@/lib/postLoginRedirect';
import { listPathKey, peekListPosition } from '@/lib/listNavigation';
import '@/App.css';

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    if (peekListPosition(listPathKey(pathname, search))) return;
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);

  return null;
}

const ProtectedRoute = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}`;
    rememberPostLoginPath(from);
    return <Navigate to="/login" replace state={{ from }} />;
  }
  return children;
};

const GuestRoute = ({ children }) => {
  const { loading, isAuthenticated, user } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (isAuthenticated) {
    if (location.pathname === '/register' && user?.role === 'artist') {
      consumePostLoginPath(ARTIST_ONBOARDING_PATH);
      return <Navigate to={ARTIST_ONBOARDING_PATH} replace />;
    }
    const next = safeInternalPath(location.state?.from) || consumePostLoginPath('/browse');
    return <Navigate to={next} replace />;
  }
  return children;
};

function AppRouter() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <AnalyticsTracker />
      <div className="flex-1">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ui" element={<UiKit />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/nous-decouvrir" element={<NousDecouvrir />} />
        <Route path="/legal" element={<LegalDocument />} />
        <Route path="/cgu" element={<LegalDocument slug="cgu" />} />
        <Route path="/cgv" element={<LegalDocument slug="cgv" />} />
        <Route path="/mentions-legales" element={<LegalDocument slug="mentions-legales" />} />
        <Route path="/confidentialite" element={<LegalDocument slug="confidentialite" />} />
        <Route path="/cookies" element={<LegalDocument slug="cookies" />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/aide" element={<Help />} />
        <Route path="/concours" element={<Concours />} />
        <Route path="/concours/:contestId" element={<Concours />} />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
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
        <Route path="*" element={<NotFound />} />
      </Routes>
      </div>
      <SiteFooter />
      <CookieBanner />
      <AudioPlayer />
      <ContestAnnounceModal />
      <ProductTour />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AudioPlayerProvider>
        <div className="App min-h-screen flex flex-col">
          <BrowserRouter>
            <AuthProvider>
              <AppRouter />
            </AuthProvider>
          </BrowserRouter>
          <Toaster />
        </div>
      </AudioPlayerProvider>
    </ThemeProvider>
  );
}

export default App;