import { db } from './db';
import type { CharacterState } from '../types';

// =============================================================================
// ID GENERATION
// =============================================================================

/**
 * Generate a unique ID for a new character
 */
export function generateCharacterId(): string {
  return crypto.randomUUID();
}

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

/**
 * Get all characters, sorted by most recently updated
 */
export async function getAllCharacters(): Promise<CharacterState[]> {
  return db.characters
    .orderBy('updatedAt')
    .reverse()
    .toArray();
}

/**
 * Get a single character by ID
 */
export async function getCharacter(id: string): Promise<CharacterState | undefined> {
  return db.characters.get(id);
}

/**
 * Save a character (create or update)
 * Returns the character's ID
 */
export async function saveCharacter(character: CharacterState): Promise<string> {
  // Ensure updatedAt is current
  const toSave: CharacterState = {
    ...character,
    updatedAt: new Date().toISOString(),
  };
  
  await db.characters.put(toSave);
  return toSave.id;
}

/**
 * Delete a character by ID
 */
export async function deleteCharacter(id: string): Promise<void> {
  await db.characters.delete(id);
}

/**
 * Check if any characters exist
 */
export async function hasCharacters(): Promise<boolean> {
  const count = await db.characters.count();
  return count > 0;
}

/**
 * Get character count
 */
export async function getCharacterCount(): Promise<number> {
  return db.characters.count();
}
