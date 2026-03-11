import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { MapPage } from './pages/MapPage';
import { CreateEventPage } from './pages/CreateEventPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { MyProfilePage } from './pages/MyProfilePage';
import { ProfilePage } from './pages/ProfilePage';
import { FriendRequestsPage } from './pages/FriendRequestsPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { useAuth } from './hooks/useAuth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="event/:id" element={<EventDetailPage />} />
          <Route path="map" element={<MapPage />} />
          <Route
            path="create"
            element={
              <ProtectedRoute>
                <CreateEventPage />
              </ProtectedRoute>
            }
          />
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignUpPage />} />
          <Route path="profile/me" element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />
          <Route path="profile/:userId" element={<ProfilePage />} />
          <Route path="friends" element={<ProtectedRoute><FriendRequestsPage /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
