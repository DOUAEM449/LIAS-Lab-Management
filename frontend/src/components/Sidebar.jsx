import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  CalendarDays,
  BookOpen,
  Handshake,
  Package,
  ClipboardCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Users2,
  FileBarChart,
  Bell,
  LogOut,
  History,
  Settings,
  FolderArchive,
} from 'lucide-react';
import {
  MANAGEMENT_ROLES,
  INTERNAL_MODULE_ROLES,
  AUDIT_ROLES,
  SYSTEM_ADMIN_ROLES,
  hasRole,
} from '../utils/roles';
import { logout } from '../services/authService';
import { ROLE_LABEL } from './ui/Badge';
import BrandMark from './ui/BrandMark';

/*
 * Navigation is grouped by what the laboratory actually does, rather than being
 * one flat list of thirteen links: the institution, its scientific activity, its
 * resources, then the technical/administrative back office. Each entry carries
 * the same role predicate the backend enforces (see utils/roles.js).
 */
const NAV_GROUPS = [
  {
    label: null,
    items: [{ to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Laboratoire',
    items: [
      { to: '/admin/members', label: 'Membres', icon: Users },
      { to: '/admin/governance', label: 'Gouvernance', icon: Users2, roles: MANAGEMENT_ROLES },
      { to: '/admin/membership-requests', label: "Demandes d'adhésion", icon: UserPlus, roles: MANAGEMENT_ROLES },
    ],
  },
  {
    label: 'Activité scientifique',
    items: [
      { to: '/admin/events', label: 'Événements', icon: Calendar },
      { to: '/admin/publications', label: 'Publications', icon: BookOpen },
      { to: '/admin/meetings', label: 'PV & Réunions', icon: ClipboardCheck, roles: INTERNAL_MODULE_ROLES },
      { to: '/admin/calendar', label: 'Calendrier', icon: CalendarDays },
    ],
  },
  {
    label: 'Ressources',
    items: [
      { to: '/admin/documents', label: 'Documents', icon: FolderArchive, roles: INTERNAL_MODULE_ROLES },
      { to: '/admin/equipment', label: 'Matériel', icon: Package, roles: INTERNAL_MODULE_ROLES },
      { to: '/admin/partnerships', label: 'Conventions', icon: Handshake, roles: MANAGEMENT_ROLES },
    ],
  },
  {
    label: 'Pilotage',
    items: [
      { to: '/admin/reports', label: "Rapports d'activité", icon: FileBarChart, roles: MANAGEMENT_ROLES },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
      { to: '/admin/audit-logs', label: "Journal d'audit", icon: History, roles: AUDIT_ROLES },
      { to: '/admin/administration', label: 'Administration', icon: Settings, roles: SYSTEM_ADMIN_ROLES },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, user, mobileOpen, onCloseMobile }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || hasRole(user, item.roles)),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      {/* Scrim behind the drawer on small screens */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-lias-navy-deep/50 z-40 lg:hidden lias-overlay-enter"
          aria-hidden="true"
        />
      )}

      {/* UI — le panneau passe d'un aplat navy à un dégradé vertical vers le navy
          profond : il gagne de la profondeur et le pied de barre se détache du
          corps de navigation sans ajouter de séparateur supplémentaire. */}
      <aside
        className={`${collapsed ? 'lg:w-[74px]' : 'lg:w-[248px]'} w-[248px]
          fixed lg:sticky inset-y-0 left-0 top-0 h-screen z-50 lg:z-auto shrink-0
          bg-gradient-to-b from-lias-navy via-lias-navy to-lias-navy-deep
          flex flex-col transition-[width,transform] duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center gap-3 px-4 h-[68px] shrink-0 border-b border-white/[0.07]">
          {/* UI — la lettre « L » en monospace cède la place à la marque du
              laboratoire : le même « L » tracé en piste de circuit que le
              logotype, en cyan sur le noir bleuté de la coquille. */}
          <BrandMark height={34} />
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-white font-semibold text-title-sm tracking-wide leading-tight">LIAS</div>
              <div className="text-lias-navy-text-dim text-[10.5px] truncate">Plateforme du laboratoire</div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden">
          {visibleGroups.map((group, gi) => (
            <div key={group.label ?? `group-${gi}`} className={gi > 0 ? 'mt-5' : ''}>
              {group.label && !collapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-lias-navy-text-dim/70">
                  {group.label}
                </div>
              )}
              {group.label && collapsed && <div className="mx-3 mb-2 h-px bg-white/[0.07]" />}

              <div className="flex flex-col gap-0.5">
                {group.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onCloseMobile}
                    title={collapsed ? label : undefined}
                    /* UI — l'état actif combinait un aplat bleu à 20 % et un rail,
                       deux signaux redondants. Le rail devient le marqueur
                       principal, le fond se réduit à un voile clair : la
                       sélection reste évidente sans alourdir la colonne. */
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 px-3 py-2.5 rounded-control text-body-sm no-underline
                       transition-[background-color,color] duration-150 ${collapsed ? 'lg:justify-center' : ''} ${
                        isActive
                          ? 'bg-lias-blue/25 text-white font-semibold shadow-glow'
                          : 'text-lias-navy-text font-medium hover:bg-white/[0.06] hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* UI — l'entrée active est marquée par un rail en dégradé
                            de marque et un fond bleu translucide : la sélection
                            se repère instantanément dans la colonne. */}
                        {isActive && (
                          <span className="lias-gradient-brand absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full" />
                        )}
                        <Icon
                          size={18}
                          strokeWidth={2.2}
                          className={`shrink-0 ${isActive ? 'text-white' : ''}`}
                        />
                        {!collapsed && <span className="truncate">{label}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-white/[0.07] shrink-0">
          {!collapsed && user && (
            <div className="px-3 pb-3 mb-1 border-b border-white/[0.07]">
              <div className="text-meta font-medium text-white truncate">{user.email}</div>
              <div className="text-[10.5px] text-lias-navy-text-dim truncate">
                {ROLE_LABEL[user.role] ?? user.role}
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            title={collapsed ? 'Déconnexion' : undefined}
            className={`w-full bg-transparent border-none text-lias-navy-text-dim cursor-pointer flex items-center
              gap-3 py-2 px-3 text-meta rounded-control hover:bg-white/[0.05] hover:text-white
              transition-colors duration-150 ${collapsed ? 'lg:justify-center' : ''}`}
          >
            <LogOut size={16} strokeWidth={2} className="shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>

          <button
            onClick={onToggle}
            className={`hidden lg:flex w-full bg-transparent border-none text-lias-navy-text-dim cursor-pointer
              items-center gap-3 py-2 px-3 text-meta rounded-control hover:bg-white/[0.05] hover:text-white
              transition-colors duration-150 ${collapsed ? 'lg:justify-center' : ''}`}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} strokeWidth={2} className="shrink-0" />
            ) : (
              <PanelLeftClose size={16} strokeWidth={2} className="shrink-0" />
            )}
            {!collapsed && <span>Réduire</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
