import { useState, useCallback } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileOverlay } from './MobileOverlay';
import { ErrorBoundary } from '../patterns/ErrorBoundary';
import { ToastContainer } from '../../features/dashboard/components/ToastContainer';

export function RootLayout() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((prev) => !prev), []);
  const toggleMobile = useCallback(() => setMobileOpen((prev) => !prev), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const mainMargin = sidebarCollapsed ? 'md:ml-16' : 'md:ml-56';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={toggleMobile} />
      <div className="flex pt-14">
        <Sidebar
          activePath={currentPath}
          activeHref={routerState.location.href}
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          mobileOpen={mobileOpen}
        />
        <MobileOverlay open={mobileOpen} onClose={closeMobile} />
        <main className={`flex-1 ml-0 ${mainMargin} min-h-[calc(100vh-3.5rem)] transition-all duration-200`}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
