/**
 * CharacterDraft - Partial character state during creation
 * 
 * This represents the in-progress character before it's saved.
 * Fields become required as the user progresses through the wizard.
 */

import type { AbilityScores, FeatureChoice, Currency, EquipmentSlot } from './index';

export type AbilityScoreMethod = 
  | '3d6_straight' 
  | '3d6_assign' 
  | '3d6_best_of_six'
  | '4d6_drop_lowest' 
  | '5d6_drop_lowest_two'
  | '4d6_reroll_ones'
  | '5d6_reroll_ones_unlimited'
  | '2d6_plus_6'
  | 'standard_array'
  | 'heroic_array'
  | 'standard_point_buy'
  | 'heroic_point_buy'
  | 'legendary_point_buy'
  | 'epic_point_buy'
  | 'manual';

export type CreationStep = 'race' | 'class' | 'abilities' | 'background' | 'review';

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
    case 'race':
      return true;
    case 'class':
      return isRaceStepComplete(draft);
    case 'abilities':
      return isRaceStepComplete(draft) && isClassStepComplete(draft);
    case 'background':
      return isRaceStepComplete(draft) && isClassStepComplete(draft) && isAbilitiesStepComplete(draft);
    case 'review':
      return isRaceStepComplete(draft) && isClassStepComplete(draft) && 
             isAbilitiesStepComplete(draft) && isBackgroundStepComplete(draft);
    default:
      return false;
  }
}
