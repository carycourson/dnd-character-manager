import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react'
import type { 
  GameData, 
  Race, 
  Class, 
  Background, 
  Spell, 
  Item, 
  Feat,
  Manifest
} from '../types/gameData';

// =============================================================================
// CONTEXT TYPES
// =============================================================================

interface GameDataContextValue extends GameData {
  isLoading: boolean;
  error: string | null;
  // Helper functions for common lookups
  getRace: (key: string) => Race | undefined;
  getClass: (key: string) => Class | undefined;
  getBackground: (key: string) => Background | undefined;
  getSpell: (key: string) => Spell | undefined;
  getItem: (key: string) => Item | undefined;
  getFeat: (key: string) => Feat | undefined;
  // List helpers (returns array sorted by name)
  raceList: Race[];
  classList: Class[];
  backgroundList: Background[];
  spellList: Spell[];
  itemList: Item[];
  featList: Feat[];
}

const defaultContextValue: GameDataContextValue = {
  races: {},
  classes: {},
  backgrounds: {},
  spells: {},
  items: {},
  feats: {},
  manifest: {
    version: '',
    generatedAt: '',
    files: {
      races: { count: 0, hash: '' },
      classes: { count: 0, hash: '' },
      backgrounds: { count: 0, hash: '' },
      spells: { count: 0, hash: '' },
      items: { count: 0, hash: '' },
      feats: { count: 0, hash: '' },
    },
  },
  isLoaded: false,
  isLoading: true,
  error: null,
  getRace: () => undefined,
  getClass: () => undefined,
  getBackground: () => undefined,
  getSpell: () => undefined,
  getItem: () => undefined,
  getFeat: () => undefined,
  raceList: [],
  classList: [],
  backgroundList: [],
  spellList: [],
  itemList: [],
  featList: [],
};

const GameDataContext = createContext<GameDataContextValue>(defaultContextValue);

// =============================================================================
// PROVIDER
// =============================================================================

interface GameDataProviderProps {
  children: ReactNode;
}

export function GameDataProvider({ children }: GameDataProviderProps) {
  const [data, setData] = useState<GameData>({
    races: {},
    classes: {},
    backgrounds: {},
    spells: {},
    items: {},
    feats: {},
    manifest: defaultContextValue.manifest,
    isLoaded: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGameData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all data files in parallel
        const [
          racesRes,
          classesRes,
          backgroundsRes,
          spellsRes,
          itemsRes,
          featsRes,
          manifestRes,
        ] = await Promise.all([
          fetch('/data/races.json'),
          fetch('/data/classes.json'),
          fetch('/data/backgrounds.json'),
          fetch('/data/spells.json'),
          fetch('/data/items.json'),
          fetch('/data/feats.json'),
          fetch('/data/manifest.json'),
        ]);

        // Check for fetch errors
        const responses = [
          { name: 'races', res: racesRes },
          { name: 'classes', res: classesRes },
          { name: 'backgrounds', res: backgroundsRes },
          { name: 'spells', res: spellsRes },
          { name: 'items', res: itemsRes },
          { name: 'feats', res: featsRes },
          { name: 'manifest', res: manifestRes },
        ];

        for (const { name, res } of responses) {
          if (!res.ok) {
            throw new Error(`Failed to load ${name}.json: ${res.status} ${res.statusText}`);
          }
        }

        // Parse JSON
        const [races, classes, backgrounds, spells, items, feats, manifest] = await Promise.all([
          racesRes.json() as Promise<Record<string, Race>>,
          classesRes.json() as Promise<Record<string, Class>>,
          backgroundsRes.json() as Promise<Record<string, Background>>,
          spellsRes.json() as Promise<Record<string, Spell>>,
          itemsRes.json() as Promise<Record<string, Item>>,
          featsRes.json() as Promise<Record<string, Feat>>,
          manifestRes.json() as Promise<Manifest>,
        ]);

        setData({
          races,
          classes,
          backgrounds,
          spells,
          items,
          feats,
          manifest,
          isLoaded: true,
        });

        console.log(`[GameData] Loaded: ${Object.keys(races).length} races, ${Object.keys(classes).length} classes, ${Object.keys(backgrounds).length} backgrounds, ${Object.keys(spells).length} spells, ${Object.keys(items).length} items, ${Object.keys(feats).length} feats`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error loading game data';
        console.error('[GameData] Load error:', message);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadGameData();
  }, []);

  // Helper functions
  const getRace = (key: string) => data.races[key];
  const getClass = (key: string) => data.classes[key];
  const getBackground = (key: string) => data.backgrounds[key];
  const getSpell = (key: string) => data.spells[key];
  const getItem = (key: string) => data.items[key];
  const getFeat = (key: string) => data.feats[key];

  // Sorted lists (memoization would be better, but keeping it simple for now)
  const sortByName = <T extends { name: string }>(obj: Record<string, T>): T[] =>
    Object.values(obj).sort((a, b) => a.name.localeCompare(b.name));

  const raceList = sortByName(data.races);
  const classList = sortByName(data.classes);
  const backgroundList = sortByName(data.backgrounds);
  const spellList = sortByName(data.spells);
  const itemList = sortByName(data.items);
  const featList = sortByName(data.feats);

  const contextValue: GameDataContextValue = {
    ...data,
    isLoading,
    error,
    getRace,
    getClass,
    getBackground,
    getSpell,
    getItem,
    getFeat,
    raceList,
    classList,
    backgroundList,
    spellList,
    itemList,
    featList,
  };

  return (
    <GameDataContext.Provider value={contextValue}>
      {children}
    </GameDataContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useGameData(): GameDataContextValue {
  const context = useContext(GameDataContext);
  if (!context) {
    throw new Error('useGameData must be used within a GameDataProvider');
  }
  return context;
}
