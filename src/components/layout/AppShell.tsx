import type { ReactNode } from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';
import type { ViewName } from './Navigation';

interface AppShellProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  hasCharacters?: boolean;
  children: ReactNode;
}

export function AppShell({ 
  currentView, 
  onNavigate, 
  hasCharacters = false,
  children 
}: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-parchment-100">
      <Header />
      <Navigation 
        currentView={currentView} 
        onNavigate={onNavigate}
        hasCharacters={hasCharacters}
      />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="bg-ink-800 text-parchment-400 text-center py-3 text-sm">
        <p>A data-driven character manager • No game content hardcoded</p>
      </footer>
    </div>
  );
}
