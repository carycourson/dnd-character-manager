/**
 * D&D 5E Character Manager - Core Type Definitions
 * 
 * These types define the data structures used throughout the application.
 * They are designed to be data-agnostic - all game-specific content comes from JSON data files.
 */

// =============================================================================
// ABILITY SCORES
// =============================================================================

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface AbilityModifiers extends AbilityScores {}

// =============================================================================
// CHARACTER STATE (User-created, persisted data)
// =============================================================================

export interface ClassLevel {
  classKey: string;      // Key into classes data (e.g., "fighter", "wizard")
  level: number;
  subclassKey?: string;  // Key into subclass data, if chosen
}

export interface EquipmentSlot {
  itemKey: string;       // Key into items data
  quantity: number;
  equipped: boolean;
  attuned?: boolean;
  customName?: string;   // For renamed items
  notes?: string;
}

export interface Currency {
  cp: number;  // Copper
  sp: number;  // Silver
  ep: number;  // Electrum
  gp: number;  // Gold
  pp: number;  // Platinum
}

export interface FeatureChoice {
  featureId: string;                    // Unique identifier for the choice point
  chosen: string | string[];            // The choice(s) made
  source: 'class' | 'race' | 'background' | 'feat';
  level?: number;                       // Level at which choice was made (for class features)
}

export interface CharacterState {
  // Identity
  id: string;
  name: string;
  playerName?: string;
  
  // Core selections (keys into data)
  raceKey: string;
  subraceKey?: string;
  classes: ClassLevel[];
  backgroundKey: string;
  
  // Ability scores (base values before racial modifiers)
  baseAbilityScores: AbilityScores;
  abilityScoreMethod: string;
  
  // All choices made during creation and level-up
  choices: FeatureChoice[];
  
  // Feats taken (keys into feats data)
  feats: string[];
  
  // Equipment
  equipment: EquipmentSlot[];
  currency: Currency;
  
  // Spellcasting
  spellsKnown: string[];      // Keys into spells data
  spellsPrepared: string[];   // Subset of spellsKnown (or all known for some classes)
  
  // Session/combat state
  currentHp: number;
  tempHp: number;
  hitDiceUsed: Record<string, number>;  // By hit die type (e.g., "d8": 2)
  deathSaves: {
    successes: number;
    failures: number;
  };
  conditions: string[];       // Active condition keys
  spellSlotsUsed: number[];   // Index = spell level - 1
  
  // Optional character details
  alignment?: string;
  faith?: string;
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
  backstory?: string;
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  notes?: string;
  
  // Metadata
  createdAt: string;          // ISO date string
  updatedAt: string;
  dataVersion: string;        // Version of game data used to create
  appVersion: string;         // Version of app used
}

// =============================================================================
// COMPUTED CHARACTER (Derived data, calculated from state + game data)
// =============================================================================

export type ProficiencyLevel = 'none' | 'proficient' | 'expertise';

export interface SkillInfo {
  modifier: number;
  proficiency: ProficiencyLevel;
  ability: AbilityKey;
  passive: number;
}

export interface SavingThrowInfo {
  modifier: number;
  proficient: boolean;
  advantage?: boolean;        // From features like "advantage on saves vs poison"
  conditions?: string[];      // Conditions that grant advantage/bonus
}

export interface SpeedInfo {
  walk: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
  hover?: boolean;
  conditions?: string[];      // Conditions affecting speed
}

export interface Feature {
  id: string;
  name: string;
  source: 'race' | 'class' | 'background' | 'feat' | 'item';
  sourceKey: string;          // The specific race/class/etc key
  level?: number;             // Level gained (for class features)
  description: string;
  hasChoices?: boolean;
  choicesMade?: string[];
}

export interface Proficiencies {
  armor: string[];
  weapons: string[];
  tools: string[];
  skills: string[];
  savingThrows: AbilityKey[];
  languages: string[];
}

export interface SpellcastingInfo {
  ability: AbilityKey;
  attackBonus: number;
  saveDC: number;
  
  // Slot-based casters
  spellSlots?: number[];      // Index = spell level - 1
  
  // Pact magic (Warlock)
  pactSlots?: number;
  pactSlotLevel?: number;
  
  // Spells known/prepared
  cantripsKnown: number;
  spellsKnown?: number;       // For known-casters (Sorcerer, Bard, etc.)
  spellsPrepared?: number;    // For prepared-casters (Cleric, Wizard, etc.)
  
  // Class-specific features
  ritualCasting?: boolean;
  spellbook?: boolean;
}

export interface HPInfo {
  max: number;
  current: number;
  temp: number;
  hitDice: Record<string, {
    total: number;
    used: number;
  }>;
}

export interface ACInfo {
  value: number;
  source: string;             // e.g., "Leather Armor + Dex", "Unarmored Defense"
  breakdown: string[];        // Detailed breakdown of AC calculation
}

export interface AttackInfo {
  name: string;
  attackBonus: number;
  damage: string;
  damageType: string;
  properties?: string[];
  range?: string;
  notes?: string;
}

export interface ComputedCharacter extends Omit<CharacterState, 'baseAbilityScores'> {
  // Identity (carried over)
  // Core selections (carried over)
  
  // Computed ability scores (with racial bonuses, ASIs, etc.)
  abilityScores: AbilityScores;
  abilityModifiers: AbilityModifiers;
  baseAbilityScores: AbilityScores;  // Original values preserved
  
  // Level info
  totalLevel: number;
  proficiencyBonus: number;
  experiencePoints?: number;
  
  // Computed skills and saves
  savingThrows: Record<AbilityKey, SavingThrowInfo>;
  skills: Record<string, SkillInfo>;
  
  // Combat stats
  hp: HPInfo;
  ac: ACInfo;
  initiative: number;
  speed: SpeedInfo;
  attacks: AttackInfo[];
  
  // Aggregated features and proficiencies
  features: Feature[];
  proficiencies: Proficiencies;
  
  // Spellcasting (if applicable)
  spellcasting?: SpellcastingInfo;
  
  // Resistances, immunities, vulnerabilities
  resistances: string[];
  immunities: string[];
  vulnerabilities: string[];
  conditionImmunities: string[];
  
  // Senses
  senses: {
    darkvision?: number;
    blindsight?: number;
    tremorsense?: number;
    truesight?: number;
  };
}

// =============================================================================
// GAME DATA (Loaded from 5etools JSON)
// =============================================================================

export interface RaceData {
  key: string;
  name: string;
  source: string;
  size: string;
  speed: number | SpeedInfo;
  abilityBonuses: Partial<AbilityScores>;
  traits: TraitData[];
  subraces?: SubraceData[];
  languages?: string[];
  proficiencies?: Partial<Proficiencies>;
}

export interface SubraceData {
  key: string;
  name: string;
  abilityBonuses?: Partial<AbilityScores>;
  traits?: TraitData[];
  overrides?: {
    speed?: number | SpeedInfo;
    size?: string;
  };
}

export interface TraitData {
  name: string;
  description: string;
  grants?: {
    proficiencies?: Partial<Proficiencies>;
    resistances?: string[];
    immunities?: string[];
    senses?: Record<string, number>;
    spells?: string[];
  };
  choices?: ChoiceData;
}

export interface ChoiceData {
  type: 'skill' | 'language' | 'tool' | 'feat' | 'spell' | 'ability' | 'custom';
  count: number;
  from: string[];             // List of valid options
  description?: string;
}

export interface ClassData {
  key: string;
  name: string;
  source: string;
  hitDie: number;
  primaryAbility: AbilityKey | AbilityKey[];
  savingThrowProficiencies: AbilityKey[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies?: string[] | ChoiceData;
  skillChoices: ChoiceData;
  startingEquipment: StartingEquipmentData;
  features: ClassFeatureData[];
  subclassFeature: {
    name: string;             // e.g., "Martial Archetype", "Arcane Tradition"
    level: number;            // Level at which subclass is chosen
  };
  spellcasting?: ClassSpellcastingData;
  subclasses: SubclassData[];
}

export interface ClassFeatureData {
  name: string;
  level: number;
  description: string;
  choices?: ChoiceData;
  grants?: {
    proficiencies?: Partial<Proficiencies>;
    features?: string[];
  };
  // For features that scale with level
  scaling?: {
    levels: number[];
    values: (string | number)[];
  };
}

export interface SubclassData {
  key: string;
  name: string;
  source: string;
  features: ClassFeatureData[];
  spellcasting?: ClassSpellcastingData;  // For subclasses that grant spellcasting
}

export interface ClassSpellcastingData {
  ability: AbilityKey;
  type: 'full' | 'half' | 'third' | 'pact';
  known?: 'all' | 'table' | number;       // How spells known is determined
  prepared?: boolean;                      // If class prepares spells
  ritual?: boolean;
  spellbook?: boolean;                    // If class uses a spellbook
  cantripsKnownTable?: number[];          // Cantrips by level
  spellsKnownTable?: number[];            // Spells known by level
  spellList: string;                      // Key to the spell list
}

export interface StartingEquipmentData {
  default: string[];          // Items always given
  choices: StartingEquipmentChoice[];
}

export interface StartingEquipmentChoice {
  options: string[][];        // Each option is an array of item keys
  description?: string;
}

export interface BackgroundData {
  key: string;
  name: string;
  source: string;
  skillProficiencies: string[];
  toolProficiencies?: string[] | ChoiceData;
  languages?: number | ChoiceData;        // Number to choose or specific options
  equipment: string[];
  feature: {
    name: string;
    description: string;
  };
  characteristics?: {
    personalityTraits?: string[];
    ideals?: string[];
    bonds?: string[];
    flaws?: string[];
  };
}

export interface FeatData {
  key: string;
  name: string;
  source: string;
  description: string;
  prerequisites?: {
    ability?: Partial<AbilityScores>;     // Minimum scores required
    proficiency?: string[];               // Required proficiencies
    race?: string[];                      // Required races
    spellcasting?: boolean;
    level?: number;
  };
  grants?: {
    abilityIncrease?: ChoiceData;
    proficiencies?: Partial<Proficiencies>;
    features?: string[];
  };
}

export interface SpellData {
  key: string;
  name: string;
  source: string;
  level: number;              // 0 for cantrips
  school: string;
  castingTime: string;
  range: string;
  components: {
    verbal: boolean;
    somatic: boolean;
    material?: string;
  };
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higherLevels?: string;
  classes: string[];          // Class keys that have access
  subclasses?: string[];      // Subclass keys that have access
}

export interface ItemData {
  key: string;
  name: string;
  source: string;
  type: 'armor' | 'weapon' | 'adventuring' | 'tool' | 'mount' | 'magic';
  rarity?: string;
  cost?: string;
  weight?: number;
  description?: string;
  
  // Armor specific
  armorClass?: number;
  armorType?: 'light' | 'medium' | 'heavy' | 'shield';
  stealthDisadvantage?: boolean;
  strengthRequirement?: number;
  
  // Weapon specific
  damage?: string;
  damageType?: string;
  properties?: string[];
  range?: string;
  
  // Magic item specific
  attunement?: boolean | string;  // true, false, or condition like "by a spellcaster"
  charges?: number;
}

// =============================================================================
// RULES CONFIGURATION
// =============================================================================

export interface RulesConfig {
  version: string;
  formulas: Record<string, string>;
  abilityScoreMethods: Record<string, AbilityScoreMethodConfig>;
  abilities: Record<AbilityKey, { name: string; description: string }>;
  skills: Record<string, { name: string; ability: AbilityKey; description: string }>;
  savingThrows: Record<AbilityKey, { name: string }>;
  proficiencyBonusTable: Record<string, number>;
  multiclassSpellSlots: MulticlassSpellSlotsConfig;
  hitDice: Record<string, number>;
  sizeCategories: Record<string, SizeCategoryConfig>;
  conditions: string[];
  damageTypes: string[];
  armorClassCalculations: Record<string, { formula: string; description: string }>;
  experienceThresholds: Record<string, number>;
  languages: { standard: string[]; exotic: string[] };
  currency: CurrencyConfig;
  rest: RestConfig;
}

export interface AbilityScoreMethodConfig {
  description: string;
  totalPoints?: number;
  minScore?: number;
  maxScore?: number;
  costs?: Record<string, number>;
  values?: number[];
  diceCount?: number;
  diceSides?: number;
  keepHighest?: number;
  rollCount?: number;
}

export interface MulticlassSpellSlotsConfig {
  description: string;
  table: Record<string, number[]>;
  casterLevelMultipliers: Record<string, number>;
  fullCasters: string[];
  halfCasters: string[];
  thirdCasters: string[];
  pactCasters: string[];
}

export interface SizeCategoryConfig {
  space: string;
  carryMultiplier: number;
}

export interface CurrencyConfig {
  exchangeRates: Record<string, number>;
  names: Record<string, string>;
}

export interface RestConfig {
  shortRest: {
    duration: string;
    hitDiceRecovery: boolean;
  };
  longRest: {
    duration: string;
    hpRecovery: string;
    hitDiceRecoveryFormula: string;
    hitDiceRecoveryMin: number;
  };
}

// =============================================================================
// GAME DATA COLLECTION
// =============================================================================

export interface GameData {
  races: Record<string, RaceData>;
  classes: Record<string, ClassData>;
  backgrounds: Record<string, BackgroundData>;
  feats: Record<string, FeatData>;
  spells: Record<string, SpellData>;
  items: Record<string, ItemData>;
  rules: RulesConfig;
  version: string;
  lastUpdated: string;
}

// =============================================================================
// VALIDATION
// =============================================================================

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// =============================================================================
// DATA MIGRATION
// =============================================================================

export interface MigrationInfo {
  fromVersion: string;
  toVersion: string;
  migrationFn: (state: CharacterState) => CharacterState;
}

// Re-export character draft types
export * from './characterDraft';