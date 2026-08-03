import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import DashboardLayout from './components/DashboardLayout';
import PublicLayout from './components/PublicLayout';
import RequireRole from './components/RequireRole';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import DemandesPage from './pages/DemandesPage';
import MembresPage from './pages/MembresPage';
import PublicationsPage from './pages/PublicationsPage';
import ReunionsPage from './pages/ReunionsPage';
import GouvernancePage from './pages/GouvernancePage';
import PartenariatsPage from './pages/PartenariatsPage';
import RapportsPage from './pages/RapportsPage';
import NotificationsPage from './pages/NotificationsPage';
import EventsPage from './pages/EventsPage';
import EquipmentPage from './pages/EquipmentPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import PublicApplyPage from './pages/PublicApplyPage';
import { isAuthenticated } from './services/authService';
import { MANAGEMENT_ROLES } from './utils/roles';
import api from './services/api';

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-lias-bg">
      <Loader2 size={28} className="animate-spin text-lias-blue" />
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(isAuthenticated());

  useEffect(() => {
    if (!isAuthenticated()) {
      setCheckingSession(false);
      return;
    }
    api
      .post('/auth/me')
      .then((res) => {
        setUser(res.data.data);
        setAuthed(true);
      })
      .catch(() => setAuthed(false))
      .finally(() => setCheckingSession(false));
  }, []);

  if (checkingSession) return <FullScreenLoader />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public showcase site — no authentication required */}
        <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
        <Route path="/apply" element={<PublicLayout><PublicApplyPage /></PublicLayout>} />

        <Route
          path="/login"
          element={
            authed ? (
              <Navigate to="/admin" replace />
            ) : (
              <LoginPage
                onLoggedIn={() => {
                  setAuthed(true);
                  api.post('/auth/me').then((res) => setUser(res.data.data));
                }}
              />
            )
          }
        />

        {/* Authenticated admin dashboard */}
        <Route
          path="/admin/*"
          element={
            authed ? (
              <DashboardLayout user={user}>
                <Routes>
                  <Route path="/" element={<DashboardPage user={user} />} />
                  <Route path="/members" element={<MembresPage />} />
                  <Route
                    path="/membership-requests"
                    element={
                      <RequireRole user={user} roles={MANAGEMENT_ROLES}>
                        <DemandesPage />
                      </RequireRole>
                    }
                  />
                  <Route path="/events" element={<EventsPage user={user} />} />
                  <Route path="/publications" element={<PublicationsPage />} />
                  <Route
                    path="/governance"
                    element={
                      <RequireRole user={user} roles={MANAGEMENT_ROLES}>
                        <GouvernancePage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/partnerships"
                    element={
                      <RequireRole user={user} roles={MANAGEMENT_ROLES}>
                        <PartenariatsPage />
                      </RequireRole>
                    }
                  />
                  <Route path="/equipment" element={<EquipmentPage user={user} />} />
                  <Route path="/meetings" element={<ReunionsPage />} />
                  <Route
                    path="/reports"
                    element={
                      <RequireRole user={user} roles={MANAGEMENT_ROLES}>
                        <RapportsPage />
                      </RequireRole>
                    }
                  />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/profile" element={<ProfilePage user={user} />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
