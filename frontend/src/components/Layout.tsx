import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { to: '/periods', label: 'Períodos', icon: '📅' },
  { to: '/reports', label: 'Reportes', icon: '📊' },
  { to: '/settings', label: 'Configuración', icon: '⚙' },
];

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-slate-800 border-r border-slate-700 shrink-0">
        <div className="p-5 border-b border-slate-700">
          <h1 className="text-lg font-bold text-white">Pagos</h1>
          <p className="text-xs text-slate-400 mt-0.5">{user?.name}</p>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white',
                )
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 h-14">
        <h1 className="text-base font-bold text-white">Pagos</h1>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-slate-300 p-2"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/90" onClick={() => setMenuOpen(false)}>
          <div className="bg-slate-800 w-64 h-full flex flex-col pt-14" onClick={(e) => e.stopPropagation()}>
            <nav className="flex-1 p-3 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-3 rounded-lg text-sm',
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300',
                    )
                  }
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="p-3 border-t border-slate-700">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-400"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:p-6 p-4 pt-18 md:pt-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
