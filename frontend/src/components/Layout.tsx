import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Wallet, ArrowLeftRight, Landmark, Tag, BarChart3 } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Budget', icon: Wallet },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/accounts', label: 'Accounts', icon: Landmark },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div id="app-shell" className="flex h-screen bg-background">
      <aside className="w-56 bg-sidebar-background text-sidebar-foreground flex flex-col border-r border-sidebar-border">
        <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Wallet className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">Budget</span>
        </div>
        <nav className="flex-1 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2 rounded-md mb-1 text-sm transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-primary'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground">Personal Finance</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div
          key={pathname}
          className="max-w-6xl mx-auto"
          style={{ animation: 'page-enter 0.3s ease-out' }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
