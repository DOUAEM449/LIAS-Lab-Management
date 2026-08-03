import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  BookOpen,
  Handshake,
  Package,
  ClipboardCheck,
  Menu,
  Users2,
  FileBarChart,
  Bell,
  LogOut,
} from 'lucide-react';
import { MANAGEMENT_ROLES, hasRole } from '../utils/roles';
import { logout } from '../services/authService';

const NAV_ITEMS = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/admin/members', label: 'Membres', icon: Users },
  { to: '/admin/membership-requests', label: "Demandes d'adhésion", icon: UserPlus, roles: MANAGEMENT_ROLES },
  { to: '/admin/governance', label: 'Gouvernance', icon: Users2, roles: MANAGEMENT_ROLES },
  { to: '/admin/events', label: 'Événements', icon: Calendar },
  { to: '/admin/publications', label: 'Publications', icon: BookOpen },
  { to: '/admin/partnerships', label: 'Conventions & Partenariats', icon: Handshake, roles: MANAGEMENT_ROLES },
  { to: '/admin/equipment', label: 'Gestion du Matériel', icon: Package },
  { to: '/admin/meetings', label: 'PV & Réunions', icon: ClipboardCheck },
  { to: '/admin/reports', label: "Rapports d'activité", icon: FileBarChart, roles: MANAGEMENT_ROLES },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
];

export default function Sidebar({ collapsed, onToggle, user }) {
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || hasRole(user, item.roles));

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside
      className={`${collapsed ? 'w-[76px]' : 'w-[260px]'} shrink-0 bg-lias-navy flex flex-col transition-[width] duration-200 overflow-hidden`}
    >
      <div className="flex items-center gap-3 px-5 py-[22px] border-b border-lias-navy-light">
        <div className="w-9 h-9 rounded-lg bg-lias-blue flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-[15px] font-mono">L</span>
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-semibold text-base tracking-wide">LIAS</div>
            <div className="text-lias-navy-text-dim text-[11px]">Laboratoire</div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {visibleItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-[11px] rounded-lg text-[13.5px] font-medium no-underline transition-colors ${
                isActive
                  ? 'bg-lias-blue/18 text-white font-semibold'
                  : 'text-lias-navy-text hover:bg-white/5'
              }`
            }
          >
            <Icon size={19} strokeWidth={2} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3.5 border-t border-lias-navy-light flex flex-col gap-1">
        <button
          onClick={handleLogout}
          className="bg-transparent border-none text-lias-navy-text-dim cursor-pointer flex items-center gap-3 py-2 px-3 text-[13px] rounded-lg hover:bg-white/5 hover:text-white"
        >
          <LogOut size={17} strokeWidth={2} className="shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
        <button
          onClick={onToggle}
          className="bg-transparent border-none text-lias-navy-text-dim cursor-pointer flex items-center gap-3 py-2 px-3 text-[12.5px] rounded-lg hover:bg-white/5"
        >
          <Menu size={17} strokeWidth={2} className="shrink-0" />
          {!collapsed && <span>Réduire</span>}
        </button>
      </div>
    </aside>
  );
}
