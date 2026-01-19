import { useState } from 'react';
import { AppShell } from './components/layout';
import type { ViewName } from './components/layout';

function App() {
  const [currentView, setCurrentView] = useState<ViewName>('list');
  
  // Placeholder - will come from state/storage later
  const hasCharacters = false;

  return (
    <AppShell 
      currentView={currentView} 
      onNavigate={setCurrentView}
      hasCharacters={hasCharacters}
    >
      {/* Temporary view content - will be replaced with real components */}
      {currentView === 'list' && (
        <div className="bg-parchment-50 rounded-lg border border-parchment-300 p-8 text-center">
          <h2 className="text-2xl font-display text-ink-800 mb-4">Your Characters</h2>
          <p className="text-ink-600 mb-6">No characters yet. Create your first adventurer!</p>
          <button 
            onClick={() => setCurrentView('create')}
            className="bg-gold-500 hover:bg-gold-600 text-ink-900 font-bold px-6 py-2 rounded-lg transition-colors"
          >
            Create Character
          </button>
        </div>
      )}
      
      {currentView === 'create' && (
        <div className="bg-parchment-50 rounded-lg border border-parchment-300 p-8">
          <h2 className="text-2xl font-display text-ink-800 mb-4">Create New Character</h2>
          <p className="text-ink-600">Character creation wizard will go here.</p>
          <p className="text-ink-500 mt-4 text-sm">
            Steps: Race → Class → Abilities → Background → Review
          </p>
        </div>
      )}
      
      {currentView === 'sheet' && (
        <div className="bg-parchment-50 rounded-lg border border-parchment-300 p-8">
          <h2 className="text-2xl font-display text-ink-800 mb-4">Character Sheet</h2>
          <p className="text-ink-600">Select a character to view their sheet.</p>
        </div>
      )}
    </AppShell>
  );
}

export default App;
