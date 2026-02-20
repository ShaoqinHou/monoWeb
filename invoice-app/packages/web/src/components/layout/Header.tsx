import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Bell, Menu, User, LogOut, Building2, Clock } from 'lucide-react';
import { SearchOmnibar } from '../patterns/SearchOmnibar';
import { CreateNewDropdown } from './CreateNewDropdown';
import { OrgSwitcher } from './OrgSwitcher';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const toggleUserMenu = useCallback(() => setUserMenuOpen((v) => !v), []);

  // Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  return (
    <>
      <header
        className="h-14 bg-[#1a2035] text-white flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-50"
        role="banner"
      >
        {/* Left: Logo + Create New */}
        <div className="flex items-center gap-3 min-w-[200px]">
          {onMenuClick && (
            <button
              className="p-2 rounded hover:bg-white/10 transition-colors md:hidden"
              onClick={onMenuClick}
              aria-label="Toggle menu"
              data-testid="hamburger-menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#13b5ea] rounded flex items-center justify-center font-bold text-sm">
              XR
            </div>
            <span className="font-semibold text-lg tracking-tight hidden sm:inline">Xero Replica</span>
          </a>
          <CreateNewDropdown />
        </div>

        {/* Center: Organization switcher */}
        <div className="flex items-center gap-1">
          <OrgSwitcher />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 min-w-[200px] justify-end">
          <button
            className="flex items-center gap-1.5 p-2 rounded hover:bg-white/10 transition-colors"
            aria-label="Search"
            onClick={openSearch}
            data-testid="header-search"
          >
            <Search className="w-5 h-5" />
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-white/50 bg-white/10 rounded border border-white/20">
              Ctrl+K
            </kbd>
          </button>
          <button
            className="p-2 rounded hover:bg-white/10 transition-colors relative"
            aria-label="Notifications"
            data-testid="header-notifications"
          >
            <Bell className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <div ref={userMenuRef} className="relative ml-2">
            <button
              onClick={toggleUserMenu}
              className="w-8 h-8 bg-[#7c5ecf] rounded-full flex items-center justify-center text-xs font-semibold hover:ring-2 hover:ring-white/30 transition-all"
              aria-label="User menu"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              data-testid="user-menu-trigger"
            >
              DC
            </button>
            {userMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-48 rounded-md border border-[#e5e7eb] bg-white py-1 shadow-lg z-50"
                role="menu"
                data-testid="user-menu"
              >
                <div className="px-4 py-2 border-b border-[#e5e7eb]">
                  <p className="text-sm font-medium text-[#1a1a2e]">Demo User</p>
                  <p className="text-xs text-[#6b7280]">demo@example.com</p>
                </div>
                <a
                  href="/settings"
                  title="Profile settings — not yet implemented"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[#1a1a2e] hover:bg-gray-50 transition-colors"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  data-testid="user-menu-profile"
                >
                  <User className="w-4 h-4 text-[#6b7280]" />
                  Profile
                </a>
                <a
                  href="/settings"
                  title="Account settings — not yet implemented"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[#1a1a2e] hover:bg-gray-50 transition-colors"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  data-testid="user-menu-account"
                >
                  <Building2 className="w-4 h-4 text-[#6b7280]" />
                  Account
                </a>
                <div className="my-1 border-t border-[#e5e7eb]" role="separator" />
                <div className="px-4 py-2" data-testid="user-menu-login-history">
                  <p className="text-xs font-medium text-[#6b7280] mb-1">Last login</p>
                  <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
                    <Clock className="w-3 h-3" />
                    <span>Today at 9:15 AM &middot; Auckland, NZ</span>
                  </div>
                </div>
                <div className="my-1 border-t border-[#e5e7eb]" role="separator" />
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#1a1a2e] hover:bg-gray-50 transition-colors"
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    // Mock logout - in production would clear auth state and redirect
                  }}
                  data-testid="user-menu-logout"
                >
                  <LogOut className="w-4 h-4 text-[#6b7280]" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <SearchOmnibar open={searchOpen} onClose={closeSearch} />
    </>
  );
}
