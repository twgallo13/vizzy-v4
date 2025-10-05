import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NAV } from '@/config/nav.config';
import { useAuth } from '@/lib/auth';
import { canAccessRoute } from '@/lib/rbac-tbac';

export function Sidebar(): JSX.Element {
  const location = useLocation();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredSections = NAV.sections.map(section => ({
    ...section,
    items: section.items.filter(item => 
      !item.requiresAuth || (user && canAccessRoute(user, item.path))
    ),
  })).filter(section => section.items.length > 0);

  return (
    <motion.aside
      className={`sidebar ${isCollapsed ? 'w-16' : 'w-64'}`}
      initial={false}
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-secondary-200 px-4">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-primary-600">Vizzy v4</h1>
          )}
          {isCollapsed && (
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {filteredSections.map((section) => (
            <div key={section.id} className="mb-6">
              {!isCollapsed && (
                <h3 className="px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
                  {section.label}
                </h3>
              )}
              
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <li key={item.id}>
                      <Link
                        to={item.path}
                        className={`group flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                            : 'text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900'
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon
                          className={`mr-3 h-5 w-5 flex-shrink-0 ${
                            isActive ? 'text-primary-600' : 'text-secondary-400 group-hover:text-secondary-600'
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User info */}
        {user && (
          <div className="border-t border-secondary-200 p-4">
            {!isCollapsed ? (
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-sm">
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900 truncate">
                    {user.displayName || 'User'}
                  </p>
                  <p className="text-xs text-secondary-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-sm">
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapse button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white border border-secondary-200 shadow-sm flex items-center justify-center hover:bg-secondary-50 transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`h-4 w-4 text-secondary-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </motion.aside>
  );
}
