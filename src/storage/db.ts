import Dexie, { type Table } from 'dexie';
import type { CharacterState } from '../types';

// =============================================================================
// DATABASE SCHEMA
// =============================================================================

export class DndDatabase extends Dexie {
  characters!: Table<CharacterState, string>;

  constructor() {
    super('dnd-character-manager');
    
    // Schema version 1
    this.version(1).stores({
      // Primary key is 'id', indexed fields for querying
      characters: 'id, name, updatedAt',
    });
  }
}

// Singleton database instance
export const db = new DndDatabase();
