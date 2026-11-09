import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Spinner } from './Spinner';

const linkBase =
  'rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80';
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `${linkBase} ${isActive ? 'bg-white/15 text-white' : 'text-blue-50 hover:bg-white/10 hover:text-white'}`;

const Navbar = () => {
  const { state, logout } = useAuth();
  const { user, loading, isAuthenticated } = state;
  const { darkMode, toggleDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close the mobile menu after navigating
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

  const themeButton = (
    <button
      type="button"
      onClick={toggleDarkMode}
      className="rounded-md p-2 text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={darkMode ? 'Light mode' : 'Dark mode'}
    >
      {darkMode ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-600 to-indigo-700 shadow-md dark:from-gray-800 dark:to-gray-900">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 rounded-md text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" />
            </svg>
            <span className="text-lg font-bold tracking-tight">Blog App</span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/my-blogs" className={navLinkClass}>
                  My Blogs
                </NavLink>
                <NavLink to="/create" className={navLinkClass}>
                  Write
                </NavLink>
              </>
            )}
            <span className="mx-2 h-6 w-px bg-white/20" aria-hidden="true" />
            {themeButton}
            {loading && !isAuthenticated ? (
              <Spinner className="ml-2 h-5 w-5 text-white" label="Loading account" />
            ) : isAuthenticated ? (
              <div className="ml-2 flex items-center gap-3">
                <div className="flex items-center gap-2" title={user?.email}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-semibold text-blue-700 dark:bg-gray-700 dark:text-white" aria-hidden="true">
                    {initial}
                  </span>
                  <span className="max-w-[10rem] truncate text-sm font-medium text-white">{user?.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="ml-2 flex items-center gap-2">
                <NavLink to="/login" className={navLinkClass}>
                  Log in
                </NavLink>
                <Link
                  to="/register"
                  className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-1 md:hidden">
            {themeButton}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-md p-2 text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="flex flex-col gap-1 border-t border-white/15 pb-4 pt-3 md:hidden">
            {isAuthenticated && (
              <div className="mb-2 flex items-center gap-2 px-3 text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-semibold text-blue-700 dark:bg-gray-700 dark:text-white" aria-hidden="true">
                  {initial}
                </span>
                <span className="truncate text-sm font-medium">{user?.name}</span>
              </div>
            )}
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/my-blogs" className={navLinkClass}>
                  My Blogs
                </NavLink>
                <NavLink to="/create" className={navLinkClass}>
                  Write a post
                </NavLink>
                <button type="button" onClick={handleLogout} className={`${linkBase} text-left text-blue-50 hover:bg-white/10`}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  Log in
                </NavLink>
                <NavLink to="/register" className={navLinkClass}>
                  Sign up
                </NavLink>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
