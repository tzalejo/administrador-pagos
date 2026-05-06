import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useShortcut } from '@/lib/shortcuts';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '⊞', shortcut: 'd' },
  { to: '/periods', label: 'Períodos', icon: '◫', shortcut: 'p' },
  { to: '/reports', label: 'Reportes', icon: '▦', shortcut: 'r' },
  { to: '/settings', label: 'Configuración', icon: '◈', shortcut: 'c' },
];

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  useShortcut('d', () => { if (pathname !== '/dashboard') navigate('/dashboard'); });
  useShortcut('p', () => { if (!pathname.startsWith('/periods')) navigate('/periods'); });
  useShortcut('r', () => { if (pathname !== '/reports') navigate('/reports'); });
  useShortcut('c', () => { if (pathname !== '/settings') navigate('/settings'); });
  useShortcut('l', handleLogout);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-card border-r border-border shrink-0">
        <div className="p-5 border-b border-border">
          <h1 className="text-base font-bold glow-text tracking-widest uppercase">Pagos</h1>
          <p className="text-xs text-muted-foreground mt-1">{user?.name}</p>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/30 glow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent',
                )
              }
            >
              <span className="text-base">{item.icon}</span>
              <span className="flex-1"><span className="underline underline-offset-2">{item.label[0]}</span>{item.label.slice(1)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-muted-foreground hover:text-destructive"
          >
            Cerrar sesión
            <kbd className="ml-auto inline-flex items-center rounded border border-current/20 px-1 font-sans text-[10px] opacity-40 leading-none">
              l
            </kbd>
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border flex items-center justify-between px-4 h-14">
        <h1 className="text-sm font-bold glow-text tracking-widest uppercase">Pagos</h1>
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-muted-foreground p-2 text-lg">
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-background/90"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="bg-card border-r border-border w-64 h-full flex flex-col pt-14"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex-1 p-3 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-3 rounded-lg text-sm border transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'text-muted-foreground border-transparent',
                    )
                  }
                >
                  <span>{item.icon}</span>
                  <span className="flex-1"><span className="underline underline-offset-2">{item.label[0]}</span>{item.label.slice(1)}</span>
                </NavLink>
              ))}
            </nav>
            <div className="p-3 border-t border-border">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-destructive"
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
