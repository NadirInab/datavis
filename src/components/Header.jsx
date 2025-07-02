import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';

const Header = () => {
  const { currentUser, logout, isAdmin, isRegularUser, isVisitor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseNavigation = [
      { name: 'Dashboard', href: '/app', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { name: 'Upload', href: '/app/upload', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' }
    ];

    const userNavigation = [
      { name: 'My Files', href: '/app/files', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
      { name: 'Profile', href: '/app/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
    ];

    const adminNavigation = [
      { name: 'Administration', href: '/app/admin', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' }
    ];

    let navItems = [...baseNavigation];

    // Add user-specific navigation for authenticated users (not visitors)
    if (isRegularUser() || isAdmin()) {
      navItems = [...navItems, ...userNavigation];
    }

    // Add admin navigation for admin users
    if (isAdmin()) {
      navItems = [...navItems, ...adminNavigation];
    }

    return navItems;
  };

  const navigation = getNavigationItems();

  const isActivePath = (href) => {
    if (href === '/app') {
      return location.pathname === '/app';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <header className="bg-white border-b border-[#84AE92]/20 shadow-sm sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand/Logo Section */}
          <div className="flex items-center">
            <Link to="/app" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#5A827E] to-[#84AE92] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#5A827E] hidden sm:block">
                DataViz Pro
              </h1>
              <h1 className="text-lg font-bold text-[#5A827E] sm:hidden">
                DataViz
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  isActivePath(item.href)
                    ? 'bg-[#5A827E] text-white shadow-sm'
                    : 'text-[#5A827E] hover:bg-[#B9D4AA]/30 hover:text-[#5A827E]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile Navigation Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#5A827E] hover:bg-[#B9D4AA]/20 focus:outline-none focus:ring-2 focus:ring-[#84AE92]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>

          {/* User Info and Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-[#5A827E]">
                {currentUser?.name || (isVisitor() ? 'Visitor' : 'User')}
              </p>
              <p className="text-xs text-[#5A827E]/70 capitalize">
                {isVisitor() ? 'Guest Session' : (currentUser?.subscription || 'Free Plan')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-[#84AE92] text-sm font-medium rounded-lg text-[#5A827E] bg-white hover:bg-[#B9D4AA]/20 hover:border-[#5A827E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#84AE92] transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#84AE92]/20 py-4">
            <nav className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-3 ${
                    isActivePath(item.href)
                      ? 'bg-[#5A827E] text-white shadow-sm'
                      : 'text-[#5A827E] hover:bg-[#B9D4AA]/30'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                  </svg>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* Mobile User Info and Logout */}
            <div className="mt-4 pt-4 border-t border-[#84AE92]/20">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-[#5A827E]">
                  {currentUser?.name || (isVisitor() ? 'Visitor' : 'User')}
                </p>
                <p className="text-xs text-[#5A827E]/70 capitalize">
                  {isVisitor() ? 'Guest Session' : (currentUser?.subscription || 'Free Plan')}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full mt-2 inline-flex items-center justify-center px-3 py-2 border border-[#84AE92] text-sm font-medium rounded-lg text-[#5A827E] bg-white hover:bg-[#B9D4AA]/20 hover:border-[#5A827E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#84AE92] transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
