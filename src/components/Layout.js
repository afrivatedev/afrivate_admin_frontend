import {
  Activity,
  LayoutDashboard,
  Link2,
  LogOut,
  Megaphone,
  Menu,
  Users,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { logout } from '../api';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/connections', label: 'Connections', icon: Link2 },
  { to: '/broadcasts', label: 'Broadcasts', icon: Megaphone },
  { to: '/actions', label: 'Action Log', icon: Activity },
];

function NavLinks({ onNavigate }) {
  return (
    <nav className="flex-1 py-4 space-y-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
              isActive
                ? 'bg-brand text-white font-semibold'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <Icon size={17} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout({ admin, onSignedOut }) {
  const [open, setOpen] = useState(false);

  // The server ends the session; App then shows the login page (route guard).
  const signOut = async () => {
    await logout();
    onSignedOut();
  };

  const accountBlock = (
    <div className="px-5 py-4 border-t border-white/10 text-sm">
      <p className="font-semibold truncate">{admin?.full_name}</p>
      <p className="text-white/60 text-xs truncate mb-3">{admin?.email}</p>
      <button
        onClick={signOut}
        className="flex items-center gap-2 text-white/70 hover:text-white text-sm"
      >
        <LogOut size={15} /> Logout
      </button>
    </div>
  );

  return (
    <div className="min-h-screen md:flex">
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-brand-dark text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <img src="logo.png" alt="AfriVate" className="h-7 w-auto object-contain" />
          <span className="font-bold">Admin</span>
        </div>
        <button onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-brand-dark text-white flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <img src="logo.png" alt="AfriVate" className="h-7 w-auto object-contain" />
                <span className="font-bold">Admin</span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            {accountBlock}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 bg-brand-dark text-white flex-col min-h-screen">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <img src="logo.png" alt="AfriVate" className="h-8 w-auto object-contain" />
          <span className="font-bold tracking-wide">Admin</span>
        </div>
        <NavLinks />
        {accountBlock}
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
