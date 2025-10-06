import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { init } from './init';
import { Layout } from '@/components/Layout';
import { CommandPalette } from '@/components/CommandPalette';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { NAV } from '@/config/nav.config';
import { trackRouteView } from '@/lib/telemetry';
import { AuthGate } from './AuthGate';

// Lazy load route components
const PlannerPage = React.lazy(() => import('@/routes/PlannerPage'));
const AIPage = React.lazy(() => import('@/routes/AIPage'));
const GovernancePage = React.lazy(() => import('@/routes/GovernancePage'));
const CalendarPage = React.lazy(() => import('@/routes/CalendarPage'));
const AssignmentPage = React.lazy(() => import('@/routes/AssignmentPage'));
const AdminWrikeSchemaPage = React.lazy(() => import('@/routes/admin/WrikeSchemaPage'));
const DataPage = React.lazy(() => import('@/routes/DataPage'));
const LoginPage = React.lazy(() => import('@/routes/LoginPage'));

// Initialize Firebase and app services
init();

function App(): JSX.Element {
  const location = useLocation();

  // Track route_view on navigation
  useEffect(() => {
    trackRouteView(location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-secondary-50">
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <AnimatePresence mode="wait">
            <AuthGate>
            <Routes>
              <Route path="/" element={<Navigate to="/planner" replace />} />
              
              {NAV.routes.map((route) => {
                const Component = getRouteComponent(route.path);
                return (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Component />
                      </motion.div>
                    }
                  />
                );
              })}

              {/* Backwards-compatible alias for /assignment */}
              <Route path="/assignment" element={<AssignmentPage />} />
              
              {/* Admin routes */}
              <Route
                path="/admin/wrike-schema"
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AdminWrikeSchemaPage />
                  </motion.div>
                }
              />
              
              {/* 404 fallback */}
              <Route
                path="*"
                element={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-secondary-900 mb-4">404</h1>
                      <p className="text-secondary-600 mb-6">Page not found</p>
                      <button 
                        onClick={() => window.history.back()}
                        className="btn-primary"
                      >
                        Go Back
                      </button>
                    </div>
                  </div>
                }
              />
              <Route path="/login" element={<Suspense fallback={null}><LoginPage /></Suspense>} />
            </Routes>
            </AuthGate>
          </AnimatePresence>
        </Suspense>
      </Layout>
      
      <CommandPalette />
    </div>
  );
}

function getRouteComponent(path: string) {
  switch (path) {
    case '/planner':
      return PlannerPage;
    case '/ai':
      return AIPage;
    case '/governance':
      return GovernancePage;
    case '/calendar':
      return CalendarPage;
    case '/assignment':
      return AssignmentPage;
    case '/data':
      return DataPage;
    default:
      return () => <div>Route not implemented: {path}</div>;
  }
}

export default App;
