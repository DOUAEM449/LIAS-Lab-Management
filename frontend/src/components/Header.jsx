import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Bell, ChevronDown, UserCircle, LogOut } from 'lucide-react';
import api from '../services/api';
import { logout } from '../services/authService';
import { ROLE_LABEL_FR } from '../utils/roles';

export default function Header({ user }) {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const popoverRef = useRef(null);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function openNotifications() {
    const next = !notifOpen;
    setNotifOpen(next);
    if (next && notifications.length === 0) {
      setNotifLoading(true);
      // A technical SYSTEM_ADMIN account has no linked Member profile, so
      // /api/v1/notifications (which resolves "current member") 404s for it.
      // Fail quietly to an empty state rather than breaking the header.
      api
        .get('/notifications', { params: { page: 0, size: 5 } })
        .then((res) => setNotifications(res.data.data.content))
        .catch(() => setNotifications([]))
        .finally(() => setNotifLoading(false));
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '--';

  return (
    <header className="h-[72px] shrink-0 bg-white border-b border-lias-border flex items-center justify-between px-7 gap-5">
      <div className="flex items-center gap-3.5 flex-1 max-w-[480px] bg-lias-bg border border-lias-border rounded-[9px] px-3.5 py-2.5">
        <Search size={17} className="text-lias-muted shrink-0" />
        <input
          type="text"
          placeholder="Recherche globale — membres, documents, événements..."
          className="border-none outline-none bg-transparent text-[13.5px] w-full text-lias-ink"
        />
      </div>

      <div className="flex items-center gap-4.5 shrink-0">
        <div className="relative" ref={popoverRef}>
          <button
            onClick={openNotifications}
            className="relative w-[38px] h-[38px] rounded-[9px] border border-lias-border bg-white cursor-pointer flex items-center justify-center"
          >
            <Bell size={18} className="text-lias-ink" strokeWidth={2} />
            <span className="absolute top-[5px] right-[5px] w-2 h-2 rounded-full bg-lias-danger border-[1.5px] border-white" />
          </button>

          {notifOpen && (
            <div className="absolute top-[46px] right-0 w-80 bg-white border border-lias-border rounded-xl shadow-[0_12px_32px_rgba(20,20,30,0.14)] overflow-hidden z-20">
              <div className="px-4 py-3.5 border-b border-lias-border-light text-[13px] font-semibold text-lias-ink">
                Notifications
              </div>
              <div className="flex flex-col max-h-80 overflow-y-auto">
                {notifLoading && (
                  <div className="px-4 py-4 text-[12.5px] text-lias-muted">Chargement...</div>
                )}
                {!notifLoading && notifications.length === 0 && (
                  <div className="px-4 py-4 text-[12.5px] text-lias-muted">
                    Aucune notification
                  </div>
                )}
                {!notifLoading &&
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="flex gap-2.5 px-4 py-3 border-b border-lias-bg last:border-b-0"
                    >
                      <div>
                        <div className="text-[12.5px] text-lias-ink font-medium">
                          {n.message}
                        </div>
                        <div className="text-[11.5px] text-lias-muted mt-0.5">
                          {new Date(n.createdAt).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-7 bg-lias-border" />

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none p-0"
          >
            <div className="w-[38px] h-[38px] rounded-full bg-lias-navy flex items-center justify-center text-white font-semibold text-[13px] shrink-0">
              {initials}
            </div>
            <div className="leading-tight text-left">
              <div className="text-[13px] font-semibold text-lias-ink">
                {user?.email ?? 'Utilisateur'}
              </div>
              <div className="text-[11px] text-lias-muted">
                {ROLE_LABEL_FR[user?.role] ?? user?.role ?? ''}
              </div>
            </div>
            <ChevronDown size={15} className="text-lias-muted" />
          </button>

          {userMenuOpen && (
            <div className="absolute top-[52px] right-0 w-52 bg-white border border-lias-border rounded-xl shadow-[0_12px_32px_rgba(20,20,30,0.14)] overflow-hidden z-20">
              <Link
                to="/admin/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-lias-ink no-underline hover:bg-lias-bg"
              >
                <UserCircle size={16} />
                Mon Profil
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-rose-600 bg-transparent border-none border-t border-lias-border-light cursor-pointer w-full text-left hover:bg-rose-50"
              >
                <LogOut size={16} />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
