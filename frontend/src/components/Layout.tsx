import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Wallet, ArrowLeftRight, Landmark, Tag, BarChart3, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';

const navItems = [
  { to: '/', label: 'Budget', icon: Wallet },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/accounts', label: 'Accounts', icon: Landmark },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  return (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onClick}
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
    </>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div id="app-shell" className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-sidebar-background text-sidebar-foreground flex-col border-r border-sidebar-border">
        <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Wallet className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">Budget</span>
        </div>
        <nav className="flex-1 p-2">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground">Personal Finance</p>
        </div>
      </aside>

      {/* Mobile header + sheet drawer */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar-background border-b border-sidebar-border px-4 py-3 flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-56 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">App navigation menu</SheetDescription>
            <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Wallet className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">Budget</span>
            </div>
            <nav className="p-2">
              <NavLinks onClick={() => setOpen(false)} />
            </nav>
          </SheetContent>
        </Sheet>
        <span className="text-lg font-bold">Budget</span>
      </div>

      <main className="flex-1 overflow-auto p-6 lg:p-8 md:pt-6 pt-20">
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
