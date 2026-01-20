/**
 * CharacterDraft - Partial character state during creation
 * 
 * This represents the in-progress character before it's saved.
 * Fields become required as the user progresses through the wizard.
 */

import type { AbilityScores, FeatureChoice } from './index';

/**
 * Ability score method key - validated at runtime against rules.abilityScoreMethods
 * We use string here because the valid values come from JSON data, not code.
 */
export type AbilityScoreMethod = string;

/**
 * Creation wizard steps - this is UI structure, not game data.
 * The order and existence of these steps is an application design choice.
 */
export type CreationStep = 'abilities' | 'race' | 'class' | 'background' | 'review';

export interface CharacterDraft {
  // Step 1: Race
  name?: string;
  raceKey?: string;
  subraceKey?: string;
  raceChoices?: FeatureChoice[];
  
  // Step 2: Class
  classKey?: string;
  classChoices?: FeatureChoice[];  // Skill selections, etc.
  
  // Step 3: Abilities
  abilityScoreMethod?: AbilityScoreMethod;
  baseAbilityScores?: AbilityScores;
  rolledScores?: number[];  // For roll methods - the actual rolls
  
  // Step 4: Background
  backgroundKey?: string;
  backgroundChoices?: FeatureChoice[];
  
  // Optional details (can be filled in at any step or skipped)
  playerName?: string;
  alignment?: string;
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
}

export interface WizardStepProps {
  draft: CharacterDraft;
  onUpdate: (updates: Partial<CharacterDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Validation helpers
export function isRaceStepComplete(draft: CharacterDraft): boolean {
  return !!draft.raceKey;
}

export function isClassStepComplete(draft: CharacterDraft): boolean {
  return !!draft.classKey;
}

export function isAbilitiesStepComplete(draft: CharacterDraft): boolean {
  return !!draft.abilityScoreMethod && !!draft.baseAbilityScores;
}

export function isBackgroundStepComplete(draft: CharacterDraft): boolean {
  return !!draft.backgroundKey;
}

export function canProceedToStep(draft: CharacterDraft, step: CreationStep): boolean {
  switch (step) {
    case 'abilities':
      return true;  // First step, always accessible
    case 'race':
      return isAbilitiesStepComplete(draft);
    case 'class':
      return isAbilitiesStepComplete(draft) && isRaceStepComplete(draft);
    case 'background':
      return isAbilitiesStepComplete(draft) && isRaceStepComplete(draft) && isClassStepComplete(draft);
    case 'review':
      return isAbilitiesStepComplete(draft) && isRaceStepComplete(draft) && 
             isClassStepComplete(draft) && isBackgroundStepComplete(draft);
    default:
      return false;
  }
}
