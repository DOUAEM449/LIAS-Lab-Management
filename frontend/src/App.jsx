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
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PublicApplyPage from './pages/PublicApplyPage';
import AdministrationPage from './pages/AdministrationPage';
import AuditLogPage from './pages/AuditLogPage';
import DocumentsPage from './pages/DocumentsPage';
import CalendarPage from './pages/CalendarPage';
import { isAuthenticated, logout } from './services/authService';
import { getMyProfile } from './services/memberService';
import { MANAGEMENT_ROLES, INTERNAL_MODULE_ROLES, AUDIT_ROLES, SYSTEM_ADMIN_ROLES } from './utils/roles';
import api from './services/api';

const FROZEN_STATUSES = ['RETIRED', 'FORMER'];

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
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [myMemberId, setMyMemberId] = useState(null);
  const [checkingSession, setCheckingSession] = useState(isAuthenticated());

  function loadAvatar() {
    // 404s for technical accounts (SYSTEM_ADMIN etc.) with no linked Member — fine, just no avatar.
    getMyProfile()
      .then((p) => {
        setAvatarUrl(p.photoUrl || null);
        setMyMemberId(p.id);
      })
      .catch(() => {
        setAvatarUrl(null);
        setMyMemberId(null);
      });
  }

  useEffect(() => {
    if (!isAuthenticated()) {
      setCheckingSession(false);
      return;
    }
    api
      .post('/auth/me')
      .then((res) => {
        const me = res.data.data;
        // Defense in depth: the backend already rejects RETIRED/FORMER accounts
        // with 401 (handled by the api.js interceptor), but if a stale/cached
        // response ever carries a frozen status, kick the user out client-side too.
        if (FROZEN_STATUSES.includes(me.status)) {
          logout();
          sessionStorage.setItem('lias_session_message', 'Votre compte a été gelé ou désactivé');
          setAuthed(false);
          return;
        }
        setUser(me);
        setAuthed(true);
        // Technical accounts (SYSTEM_ADMIN) have no linked Member: `me.status` is
        // null. Skip the member-only avatar fetch so it doesn't 404 on every load.
        if (me.status) {
          loadAvatar();
        }
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
                  api.post('/auth/me').then((res) => {
                    const me = res.data.data;
                    setUser(me);
                    if (me.status) loadAvatar();
                  });
                }}
              />
            )
          }
        />
        <Route path="/forgot-password" element={authed ? <Navigate to="/admin" replace /> : <ForgotPasswordPage />} />
        <Route path="/reset-password" element={authed ? <Navigate to="/admin" replace /> : <ResetPasswordPage />} />

        {/* Authenticated admin dashboard */}
        <Route
          path="/admin/*"
          element={
            authed ? (
              <DashboardLayout user={user} avatarUrl={avatarUrl}>
                <Routes>
                  <Route path="/" element={<DashboardPage user={user} />} />
                  <Route path="/members" element={<MembresPage currentUser={user} myMemberId={myMemberId} />} />
                  <Route
                    path="/membership-requests"
                    element={
                      <RequireRole user={user} roles={MANAGEMENT_ROLES}>
                        <DemandesPage user={user} />
                      </RequireRole>
                    }
                  />
                  <Route path="/events" element={<EventsPage user={user} />} />
                  <Route path="/publications" element={<PublicationsPage user={user} />} />
                  <Route
                    path="/governance"
                    element={
                      <RequireRole user={user} roles={MANAGEMENT_ROLES}>
                        <GouvernancePage user={user} />
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
                  <Route
                    path="/equipment"
                    element={
                      <RequireRole user={user} roles={INTERNAL_MODULE_ROLES}>
                        <EquipmentPage user={user} />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/meetings"
                    element={
                      <RequireRole user={user} roles={INTERNAL_MODULE_ROLES}>
                        <ReunionsPage user={user} />
                      </RequireRole>
                    }
                  />
                  {/* CdC §2.10 — archivage documentaire. Mirrors DocumentController's
                      class-level rule: an internal module, closed to doctorants. */}
                  <Route
                    path="/documents"
                    element={
                      <RequireRole user={user} roles={INTERNAL_MODULE_ROLES}>
                        <DocumentsPage user={user} />
                      </RequireRole>
                    }
                  />
                  {/* CdC §2.20 — calendrier. CalendarController is isAuthenticated(),
                      so no extra role gate here: the frontend must not be stricter
                      than the backend. */}
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route
                    path="/reports"
                    element={
                      <RequireRole user={user} roles={MANAGEMENT_ROLES}>
                        <RapportsPage />
                      </RequireRole>
                    }
                  />
                  <Route path="/notifications" element={<NotificationsPage user={user} />} />
                  <Route
                    path="/profile"
                    element={<ProfilePage user={user} onAvatarUpdated={setAvatarUrl} />}
                  />
                  <Route
                    path="/administration"
                    element={
                      <RequireRole user={user} roles={SYSTEM_ADMIN_ROLES}>
                        <AdministrationPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/audit-logs"
                    element={
                      <RequireRole user={user} roles={AUDIT_ROLES}>
                        <AuditLogPage />
                      </RequireRole>
                    }
                  />
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
