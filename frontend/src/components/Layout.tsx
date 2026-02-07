import { NavLink, Outlet } from 'react-router-dom';
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
  return (
    <div id="app-shell" className="flex h-screen bg-background">
      <aside className="w-56 bg-sidebar-background text-sidebar-foreground flex flex-col border-r border-sidebar-border">
        <div className="p-4 text-xl font-bold border-b border-sidebar-border">Budget App</div>
        <nav className="flex-1 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2 rounded-md mb-1 text-sm',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
