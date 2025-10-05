import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps): JSX.Element {
  return (
    <div className="min-h-screen bg-secondary-50">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
