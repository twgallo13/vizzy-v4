import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Command, Zap, Brain, Shield } from 'lucide-react';
import { NAV } from '@/config/nav.config';
import { useAuth } from '@/lib/auth';
import { canAccessRoute } from '@/lib/rbac-tbac';
import { trackUserAction } from '@/lib/telemetry';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
  category: string;
}

export function CommandPalette(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate command items
  const getCommandItems = (): CommandItem[] => {
    const items: CommandItem[] = [];

    // Navigation items
    const navItems = NAV.routes.filter(item => 
      !item.requiresAuth || (user && canAccessRoute(user, item.path))
    );

    navItems.forEach((item) => {
      items.push({
        id: `nav-${item.id}`,
        label: item.label,
        description: item.description,
        icon: item.icon,
        action: () => {
          navigate(item.path);
          setIsOpen(false);
          trackUserAction('navigate', item.path);
        },
        category: 'Navigation',
      });
    });

    // Quick actions
    NAV.quickActions.forEach((action) => {
      items.push({
        id: `action-${action.id}`,
        label: action.label,
        description: action.description,
        icon: action.icon,
        action: () => {
          handleQuickAction(action.action);
          setIsOpen(false);
          trackUserAction('quick_action', action.action);
        },
        shortcut: action.shortcut,
        category: 'Actions',
      });
    });

    return items;
  };

  const handleQuickAction = (action: string): void => {
    switch (action) {
      case 'create-campaign':
        navigate('/planner?action=create');
        break;
      case 'ai-suggest':
        navigate('/ai?action=suggest');
        break;
      case 'review-queue':
        navigate('/governance?filter=pending');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const allItems = getCommandItems();
  const filteredItems = allItems.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.description?.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }

      if (!isOpen) return;

      // Close command palette
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(0);
        return;
      }

      // Navigate items
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
        return;
      }

      // Execute selected item
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(0);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Navigation':
        return Command;
      case 'Actions':
        return Zap;
      default:
        return Search;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20"
        >
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="w-full max-w-2xl mx-4 bg-white rounded-lg shadow-xl border border-secondary-200"
          >
            {/* Input */}
            <div className="flex items-center px-4 py-3 border-b border-secondary-200">
              <Search className="h-5 w-5 text-secondary-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search commands, navigate, or run actions..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 text-lg placeholder-secondary-500 focus:outline-none"
              />
              <kbd className="px-2 py-1 text-xs text-secondary-500 bg-secondary-100 rounded">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-secondary-500">
                  <Search className="h-8 w-8 mx-auto mb-2 text-secondary-300" />
                  <p>No commands found</p>
                </div>
              ) : (
                <div className="py-2">
                  {filteredItems.map((item, index) => {
                    const CategoryIcon = getCategoryIcon(item.category);
                    const ItemIcon = item.icon || CategoryIcon;
                    
                    return (
                      <motion.button
                        key={item.id}
                        onClick={item.action}
                        className={`w-full flex items-center px-4 py-3 text-left hover:bg-secondary-50 ${
                          index === selectedIndex ? 'bg-primary-50 text-primary-900' : 'text-secondary-900'
                        }`}
                        whileHover={{ backgroundColor: 'rgb(249 250 251)' }}
                      >
                        <ItemIcon className={`h-5 w-5 mr-3 ${
                          index === selectedIndex ? 'text-primary-600' : 'text-secondary-400'
                        }`} />
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                          {item.description && (
                            <p className="text-xs text-secondary-500 truncate">{item.description}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {item.shortcut && (
                            <kbd className="px-2 py-1 text-xs text-secondary-500 bg-secondary-100 rounded">
                              {item.shortcut}
                            </kbd>
                          )}
                          <ArrowRight className="h-4 w-4 text-secondary-400" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-secondary-200 bg-secondary-50 text-xs text-secondary-500">
              <div className="flex items-center justify-between">
                <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
                <span>⌘K to open</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
