import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Bell,
  ChevronDown,
  UserCircle,
  LogOut,
  Loader2,
  Users,
  BookOpen,
  Calendar,
  Package,
  FileText,
  PanelLeft,
} from 'lucide-react';
import api from '../services/api';
import { logout } from '../services/authService';
import { ROLE_LABEL_FR } from '../utils/roles';
import Avatar from './ui/Avatar';

// CdC §2.19 "recherche globale": every result category now deep-links into the
// page that owns it — documents and equipment included, since both have a
// dedicated route today.
const SEARCH_CATEGORY = {
  MEMBER: { icon: Users, label: 'Membre', to: '/admin/members' },
  PUBLICATION: { icon: BookOpen, label: 'Publication', to: '/admin/publications' },
  EVENT: { icon: Calendar, label: 'Événement', to: '/admin/events' },
  EQUIPMENT: { icon: Package, label: 'Matériel', to: '/admin/equipment' },
  DOCUMENT: { icon: FileText, label: 'Document', to: '/admin/documents' },
};

export default function Header({ user, avatarUrl, onToggleSidebar }) {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const popoverRef = useRef(null);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    }
    function handleShortcut(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleShortcut);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleShortcut);
    };
  }, []);

  // Real unread badge rather than a permanent red dot. A technical SYSTEM_ADMIN
  // account has no linked Member profile, so this 404s for it — fail quietly.
  // Only technical accounts (SYSTEM_ADMIN) have no member inbox — `user.status`
  // is null for them, so skip the poll entirely rather than 404 every minute.
  const hasInbox = Boolean(user?.status);
  const refreshUnread = useCallback(() => {
    if (!hasInbox) return;
    api
      .get('/notifications/unread-count')
      .then((res) => setUnreadCount(res.data.data ?? 0))
      .catch(() => setUnreadCount(0));
  }, [hasInbox]);

  useEffect(() => {
    if (!hasInbox) return undefined;
    refreshUnread();
    const interval = setInterval(refreshUnread, 60_000);
    return () => clearInterval(interval);
  }, [refreshUnread, hasInbox]);

  // Debounced global search (CdC §2.19).
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return undefined;
    }
    setSearchLoading(true);
    const t = setTimeout(() => {
      api
        .get('/search', { params: { q } })
        .then((res) => setSearchResults(res.data.data))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  function handleResultClick(result) {
    const category = SEARCH_CATEGORY[result.entityType];
    setSearchOpen(false);
    setSearchQuery('');
    if (category?.to) navigate(category.to);
  }

  function openNotifications() {
    const next = !notifOpen;
    setNotifOpen(next);
    if (next) {
      setNotifLoading(true);
      api
        .get('/notifications', { params: { page: 0, size: 6 } })
        .then((res) => setNotifications(res.data.data.content))
        .catch(() => setNotifications([]))
        .finally(() => setNotifLoading(false));
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    /* UI — barre translucide avec flou d'arrière-plan : au défilement, le contenu
       se devine sous l'en-tête au lieu de disparaître derrière un bandeau opaque. */
    <header className="h-[68px] shrink-0 bg-lias-surface/70 backdrop-blur-xl border-b border-lias-border/70 flex items-center justify-between px-5 sm:px-7 gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onToggleSidebar}
          aria-label="Afficher/masquer le menu"
          className="lg:hidden w-9 h-9 rounded-control border border-lias-border bg-lias-surface cursor-pointer
            flex items-center justify-center text-lias-muted hover:text-lias-ink shrink-0"
        >
          <PanelLeft size={17} />
        </button>

        <div className="relative flex-1 max-w-[520px]" ref={searchRef}>
          {/* UI — au focus le champ passe en surface pleine et reçoit un halo teinté,
              ce qui en fait clairement la zone active de la barre. */}
          <div
            className="flex items-center gap-3 bg-lias-surface-muted border border-lias-border rounded-control px-3.5 py-2.5
              focus-within:border-lias-blue focus-within:bg-lias-surface focus-within:ring-2 focus-within:ring-lias-blue/15
              transition-[background-color,border-color,box-shadow] duration-150"
          >
            <Search size={16} className="text-lias-faint shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Rechercher un membre, un document, un événement..."
              className="border-none outline-none bg-transparent text-body-sm w-full text-lias-ink placeholder:text-lias-faint"
            />
            {searchLoading ? (
              <Loader2 size={14} className="animate-spin text-lias-faint shrink-0" />
            ) : (
              <kbd className="hidden sm:inline-block text-[10.5px] font-sans font-semibold text-lias-faint border border-lias-border rounded px-1.5 py-0.5 shrink-0">
                Ctrl K
              </kbd>
            )}
          </div>

          {searchOpen && searchQuery.trim().length >= 2 && (
            <div className="absolute top-[46px] left-0 w-full bg-lias-surface border border-lias-border rounded-card shadow-overlay overflow-hidden z-20 lias-enter">
              <div className="flex flex-col max-h-96 overflow-y-auto">
                {!searchLoading && searchResults.length === 0 && (
                  <div className="px-4 py-5 text-meta text-lias-muted text-center">
                    Aucun résultat pour « {searchQuery.trim()} ».
                  </div>
                )}
                {searchResults.map((r) => {
                  const category = SEARCH_CATEGORY[r.entityType] || { icon: Search, label: r.entityType };
                  const Icon = category.icon;
                  return (
                    <button
                      key={`${r.entityType}-${r.id}`}
                      onClick={() => handleResultClick(r)}
                      disabled={!category.to}
                      className={`flex items-center gap-3 px-4 py-2.5 border-b border-lias-border-light last:border-b-0
                        text-left bg-transparent border-x-0 border-t-0 w-full transition-colors duration-150
                        ${category.to ? 'cursor-pointer hover:bg-lias-surface-muted' : 'cursor-default'}`}
                    >
                      <div className="lias-gradient-brand w-8 h-8 rounded-control flex items-center justify-center shrink-0">
                        <Icon size={14} className="text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-meta font-medium text-lias-ink truncate">{r.title}</div>
                        <div className="text-[11px] text-lias-muted">
                          {category.label}
                          {r.subtitle ? ` — ${r.subtitle}` : ''}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <div className="relative" ref={popoverRef}>
          <button
            onClick={openNotifications}
            aria-label="Notifications"
            className="relative w-[38px] h-[38px] rounded-control border border-lias-border bg-lias-surface cursor-pointer
              flex items-center justify-center text-lias-ink hover:bg-lias-surface-muted transition-colors duration-150"
          >
            <Bell size={17} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-lias-danger
                text-white text-[10px] font-bold flex items-center justify-center border-2 border-lias-surface">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute top-[46px] right-0 w-[340px] bg-lias-surface border border-lias-border rounded-card shadow-overlay overflow-hidden z-20 lias-enter">
              <div className="flex items-center justify-between px-4 py-3 border-b border-lias-border-light">
                <span className="text-body-sm font-semibold text-lias-navy">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-semibold text-lias-blue-dark">{unreadCount} non lue(s)</span>
                )}
              </div>
              <div className="flex flex-col max-h-80 overflow-y-auto">
                {notifLoading && (
                  <div className="px-4 py-6 text-meta text-lias-muted text-center">Chargement...</div>
                )}
                {!notifLoading && notifications.length === 0 && (
                  <div className="px-4 py-6 text-meta text-lias-muted text-center">Aucune notification.</div>
                )}
                {!notifLoading &&
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-2.5 px-4 py-3 border-b border-lias-border-light last:border-b-0
                        ${n.read ? '' : 'bg-lias-blue-tint-solid/50'}`}
                    >
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-lias-blue mt-2 shrink-0" />}
                      <div className={n.read ? 'pl-4' : ''}>
                        <div className="text-meta text-lias-ink leading-snug">{n.message}</div>
                        <div className="text-[11px] text-lias-muted mt-1">
                          {new Date(n.createdAt).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              <Link
                to="/admin/notifications"
                onClick={() => setNotifOpen(false)}
                className="block px-4 py-3 text-[12.5px] font-semibold text-lias-blue-dark no-underline text-center
                  border-t border-lias-border-light hover:bg-lias-surface-muted transition-colors duration-150"
              >
                Voir toutes les notifications
              </Link>
            </div>
          )}
        </div>

        <div className="w-px h-7 bg-lias-border hidden sm:block" />

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none p-0 rounded-control"
          >
            {/* Repli photo -> initiales -> silhouette (cf. ui/Avatar). */}
            <Avatar src={avatarUrl} email={user?.email} size={38} />
            <div className="leading-tight text-left hidden md:block max-w-[180px]">
              <div className="text-meta font-semibold text-lias-ink truncate">
                {user?.email ?? 'Utilisateur'}
              </div>
              <div className="text-[11px] text-lias-muted truncate">
                {ROLE_LABEL_FR[user?.role] ?? user?.role ?? ''}
              </div>
            </div>
            <ChevronDown size={15} className="text-lias-faint hidden md:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute top-[52px] right-0 w-56 bg-lias-surface border border-lias-border rounded-card shadow-overlay overflow-hidden z-20 lias-enter">
              <div className="px-4 py-3 border-b border-lias-border-light md:hidden">
                <div className="text-meta font-semibold text-lias-ink truncate">{user?.email}</div>
                <div className="text-[11px] text-lias-muted">{ROLE_LABEL_FR[user?.role] ?? user?.role}</div>
              </div>
              <Link
                to="/admin/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-lias-ink no-underline
                  hover:bg-lias-surface-muted transition-colors duration-150"
              >
                <UserCircle size={16} className="text-lias-muted" />
                Mon profil
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-lias-danger-text bg-transparent
                  border-x-0 border-b-0 border-t border-lias-border-light cursor-pointer w-full text-left
                  hover:bg-lias-danger-bg transition-colors duration-150"
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
