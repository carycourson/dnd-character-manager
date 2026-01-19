import { useState } from 'react';
import { AppShell } from './components/layout';
import type { ViewName } from './components/layout';
import { useGameData } from './contexts/GameDataContext';

function App() {
  const [currentView, setCurrentView] = useState<ViewName>('list');
  const { isLoading, error, raceList, classList, backgroundList, spellList, itemList, featList } = useGameData();
  
  // Placeholder - will come from state/storage later
  const hasCharacters = false;

  // Show loading state
  if (isLoading) {
    return (
      <AppShell currentView={currentView} onNavigate={setCurrentView} hasCharacters={false}>
        <div className="bg-parchment-50 rounded-lg border border-parchment-300 p-8 text-center">
          <div className="animate-pulse">
            <div className="text-4xl mb-4">⚔️</div>
            <h2 className="text-xl font-display text-ink-700">Loading Game Data...</h2>
            <p className="text-ink-500 mt-2">Preparing your adventure</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // Show error state
  if (error) {
    return (
      <AppShell currentView={currentView} onNavigate={setCurrentView} hasCharacters={false}>
        <div className="bg-blood-50 rounded-lg border border-blood-300 p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-display text-blood-700">Failed to Load Game Data</h2>
          <p className="text-blood-600 mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-blood-500 hover:bg-blood-600 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell 
      currentView={currentView} 
      onNavigate={setCurrentView}
      hasCharacters={hasCharacters}
    >
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
          
          {/* Data loaded confirmation */}
          <div className="mt-8 pt-6 border-t border-parchment-300">
            <p className="text-sm text-ink-500 mb-2">Game data loaded:</p>
            <div className="flex flex-wrap justify-center gap-3 text-xs">
              <span className="bg-parchment-200 px-2 py-1 rounded">{raceList.length} races</span>
              <span className="bg-parchment-200 px-2 py-1 rounded">{classList.length} classes</span>
              <span className="bg-parchment-200 px-2 py-1 rounded">{backgroundList.length} backgrounds</span>
              <span className="bg-parchment-200 px-2 py-1 rounded">{spellList.length} spells</span>
              <span className="bg-parchment-200 px-2 py-1 rounded">{itemList.length} items</span>
              <span className="bg-parchment-200 px-2 py-1 rounded">{featList.length} feats</span>
            </div>
          </div>
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
