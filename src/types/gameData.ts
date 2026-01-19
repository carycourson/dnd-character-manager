/**
 * Types for the transformed game data (output of build-data.js)
 * These match the structure in public/data/*.json
 */

// =============================================================================
// COMMON
// =============================================================================

export interface Choice {
  from: string[] | string;
  count: number;
}

export interface ChoiceOption {
  choose: Choice;
}

// =============================================================================
// RACES
// =============================================================================

export interface RaceAbilityBonuses {
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  choose?: Choice;
}

export interface RaceTrait {
  name?: string;
  text?: string | string[];
  type?: string;
  items?: unknown[];
}

export interface Subrace {
  key: string;
  name: string;
  source: string;
  abilityBonuses: RaceAbilityBonuses;
  traits: RaceTrait[];
}

export interface Race {
  key: string;
  name: string;
  source: string;
  page?: number;
  size: string;
  speed: number | { walk?: number; fly?: number; swim?: number; climb?: number };
  abilityBonuses: RaceAbilityBonuses;
  languages: (string | ChoiceOption)[];
  skillProficiencies: (string | ChoiceOption)[];
  senses: { darkvision?: number };
  traits: RaceTrait[];
  subraces?: Subrace[];
  srd: boolean;
  basicRules: boolean;
}

// =============================================================================
// CLASSES
// =============================================================================

export interface ClassFeatureRef {
  name: string;
  className: string;
  level: number;
  source: string;
  gainSubclassFeature?: boolean;
}

export interface StartingProficiencies {
  armor: string[];
  weapons: string[];
  tools: (string | ChoiceOption)[];
  skills: (string | ChoiceOption)[];
}

export interface Spellcasting {
  ability: string;
  casterType: string | null;
  cantripsKnown: number[] | null;
  spellsKnown: number[] | null;
  spellsKnownProgressionFixedByLevel?: Record<string, number> | null;
}

export interface MulticlassRequirements {
  requirements: Record<string, unknown> | null;
  proficienciesGained: Record<string, string[]> | null;
}

export interface SubclassFeatureRef {
  name: string;
  level: number;
}

export interface Subclass {
  key: string;
  name: string;
  shortName: string;
  source: string;
  subclassFeatures: SubclassFeatureRef[];
}

export interface Class {
  key: string;
  name: string;
  source: string;
  page?: number;
  hitDie: number;
  savingThrows: string[];
  startingProficiencies: StartingProficiencies;
  classFeatures: ClassFeatureRef[];
  spellcasting: Spellcasting | null;
  multiclassing: MulticlassRequirements | null;
  subclassTitle: string;
  subclassLevel: number;
  subclasses?: Subclass[];
  srd: boolean;
  basicRules: boolean;
}

// =============================================================================
// BACKGROUNDS
// =============================================================================

export interface BackgroundFeature {
  name: string;
  description: string[];
}

export interface Background {
  key: string;
  name: string;
  source: string;
  page?: number;
  skillProficiencies: (string | ChoiceOption)[];
  toolProficiencies: (string | ChoiceOption)[];
  languages: (string | ChoiceOption)[];
  feature: BackgroundFeature | null;
  srd: boolean;
  basicRules: boolean;
}

// =============================================================================
// SPELLS
// =============================================================================

export interface SpellComponents {
  verbal: boolean;
  somatic: boolean;
  material: string | null;
}

export interface Spell {
  key: string;
  name: string;
  source: string;
  page?: number;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: SpellComponents;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string[];
  higherLevel: string[] | null;
  classes: string[];
  srd: boolean;
  basicRules: boolean;
}

// =============================================================================
// ITEMS
// =============================================================================

export interface Item {
  key: string;
  name: string;
  source: string;
  page?: number;
  type: string;
  weight: number | null;
  value: number | null;
  ac: number | null;
  armorType: 'light' | 'medium' | 'heavy' | 'shield' | null;
  strengthRequirement: number | null;
  stealthDisadvantage: boolean;
  damage: string | null;
  damageType: string | null;
  properties: string[];
  range: string | null;
  entries: string[] | null;
  srd: boolean;
  basicRules: boolean;
}

// =============================================================================
// FEATS
// =============================================================================

export interface FeatPrerequisites {
  ability: Record<string, number> | null;
  race: string[] | null;
  spellcasting: boolean;
  level: number | null;
  proficiency: string[] | null;
}

export interface Feat {
  key: string;
  name: string;
  source: string;
  page?: number;
  prerequisites: FeatPrerequisites | null;
  abilityIncrease: Record<string, number> | null;
  entries: RaceTrait[];
  srd: boolean;
  basicRules: boolean;
}

// =============================================================================
// MANIFEST & GAME DATA
// =============================================================================

export interface ManifestFile {
  count: number;
  hash: string;
}

export interface Manifest {
  version: string;
  generatedAt: string;
  files: {
    races: ManifestFile;
    classes: ManifestFile;
    backgrounds: ManifestFile;
    spells: ManifestFile;
    items: ManifestFile;
    feats: ManifestFile;
  };
}

export interface GameData {
  races: Record<string, Race>;
  classes: Record<string, Class>;
  backgrounds: Record<string, Background>;
  spells: Record<string, Spell>;
  items: Record<string, Item>;
  feats: Record<string, Feat>;
  manifest: Manifest;
  isLoaded: boolean;
}
