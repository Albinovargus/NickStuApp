import { Link, Outlet, useLocation } from 'react-router';
import { ChevronLeft } from 'lucide-react';

export function PublicShell() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className="flex h-[100dvh] flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-2">
        {!isHome && (
          <Link
            to="/"
            aria-label="Back to modules"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted"
          >
            <ChevronLeft className="size-5" />
          </Link>
        )}
        <span className={isHome ? 'px-2 text-lg font-semibold' : 'text-lg font-semibold'}>MyApp</span>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
