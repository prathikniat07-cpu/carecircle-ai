import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  Users,
  Activity,
  Heart,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/tasks', icon: ClipboardList, label: 'Care Tasks' },
  { to: '/appointments', icon: CalendarDays, label: 'Appointments' },
  { to: '/family', icon: Users, label: 'Family' },
  { to: '/activity', icon: Activity, label: 'Activity' },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-forest text-text-inverse lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen bg-forest-dark text-text-inverse
          flex flex-col justify-between transition-transform duration-200 ease-in-out
          w-64 shrink-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky lg:top-0 lg:z-30
        `}
      >
        {/* Top brand & nav section */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand */}
          <div className="px-6 pt-7 pb-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Heart size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold font-[family-name:var(--font-heading)] tracking-tight">
                  CareCircle
                </h1>
                <span className="text-[11px] text-white/50 font-medium tracking-wide uppercase">
                  AI
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-[var(--transition-fast)]
                ${isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/65 hover:bg-white/8 hover:text-white/90'
                }
              `}
              end={to === '/'}
            >
              <Icon size={18} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>
        </div>

        {/* Demo indicator */}
        <div className="px-4 py-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-xs font-semibold">
              AR
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/80 truncate">Anika Rao</p>
              <p className="text-[10px] text-white/40">Primary caregiver</p>
            </div>
          </div>
          <div className="mt-3 px-2 py-1.5 rounded-md bg-amber/20 text-center">
            <span className="text-[10px] font-semibold text-amber-light tracking-wider uppercase">
              Demo Data
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
