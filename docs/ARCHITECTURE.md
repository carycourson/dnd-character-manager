# D&D 5E Character Manager - Architecture Document

## Overview

A Progressive Web App for creating, managing, and advancing D&D 5E characters. Designed with a data-driven architecture that derives all game rules from external JSON data sources, with zero hardcoded game content.

## Data Source

**Primary:** https://github.com/carycourson/2014-5e-tools-src

This repository contains comprehensive D&D 5E data in JSON format:
- `/data/classes.json` - Class definitions with features by level
- `/data/races.json` - Race and subrace definitions
- `/data/backgrounds.json` - Background options
- `/data/feats.json` - Feat definitions
- `/data/spells/` - Spell data organized by source
- `/data/items.json` - Equipment and magic items
- Plus: conditions, languages, skills, and more

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | React 18+ | Component model, ecosystem, PWA support |
| Language | TypeScript | Type safety for complex data structures |
| Styling | Tailwind CSS | Rapid iteration, design system |
| State | Zustand | Lightweight, selector-based, devtools |
| Data Fetching | React Query | Caching, background updates |
| Persistence | Dexie.js (IndexedDB) | Structured storage, transactions |
| Build | Vite | Fast HMR, optimized builds |
| Testing | Vitest + Testing Library | Fast, React-friendly |

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React UI Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Creation   │  │  Character  │  │  Level-Up               │  │
│  │  Wizard     │  │  Sheet      │  │  Flow                   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     State Management (Zustand)                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ characterStore   │  │ uiStore          │  │ dataStore      │ │
│  │ - characters[]   │  │ - activeTab      │  │ - races        │ │
│  │ - activeId       │  │ - modals         │  │ - classes      │ │
│  │ - CRUD actions   │  │ - preferences    │  │ - spells, etc  │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      Core Engine Layer                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  CharacterCalculator                       │  │
│  │  computeCharacter(state, gameData) → ComputedCharacter    │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────┐  ┌────────────────────────────────┐  │
│  │  FormulaEvaluator     │  │  ValidationEngine              │  │
│  │  - parse formulas     │  │  - choice constraints          │  │
│  │  - table lookups      │  │  - prerequisite checks         │  │
│  └───────────────────────┘  └────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌───────────────────────┐  ┌────────────────────────────────┐  │
│  │  DataLoader           │  │  StorageAdapter                │  │
│  │  - fetch game data    │  │  - save characters             │  │
│  │  - cache in SW        │  │  - load characters             │  │
│  │  - version checking   │  │  - migration support           │  │
│  └───────────────────────┘  └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Game Data (Read-Only)
```
5etools Repo → Build Script → /public/data/*.json → Service Worker Cache → React Query → UI
```

### Character Data (Read-Write)
```
UI Actions → Zustand Store → CharacterCalculator → UI Update
                    ↓
              Dexie/IndexedDB (async persist)
```

## Core Data Schemas

### CharacterState (User-Created Data)
```typescript
interface CharacterState {
  id: string;
  name: string;
  
  // References to game data (keys)
  race: string;
  subrace?: string;
  classes: ClassLevel[];
  background: string;
  
  // User inputs
  baseAbilityScores: AbilityScores;
  
  // Choices made during creation/level-up
  choices: {
    [featureId: string]: string | string[];
  };
  
  // Inventory
  equipment: EquipmentSlot[];
  currency: Currency;
  
  // Spellcasting
  spellsKnown: string[];  // spell keys
  preparedSpells: string[];
  
  // Session state
  currentHp: number;
  tempHp: number;
  conditions: string[];
  spellSlotsUsed: number[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  dataVersion: string;
}

interface ClassLevel {
  class: string;  // key into classes data
  level: number;
  subclass?: string;
}

interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}
```

### ComputedCharacter (Derived Data)
```typescript
interface ComputedCharacter extends CharacterState {
  // Computed from base + race + features
  abilityScores: AbilityScores;
  abilityModifiers: AbilityScores;
  
  // Computed from level
  proficiencyBonus: number;
  totalLevel: number;
  
  // Computed from class/race/background
  savingThrows: {
    [ability: string]: {
      modifier: number;
      proficient: boolean;
    };
  };
  
  skills: {
    [skill: string]: {
      modifier: number;
      proficiency: 'none' | 'proficient' | 'expertise';
    };
  };
  
  // Aggregated features
  features: Feature[];
  proficiencies: Proficiencies;
  
  // Combat stats
  maxHp: number;
  armorClass: number;
  initiative: number;
  speed: SpeedInfo;
  
  // Spellcasting (if applicable)
  spellcasting?: {
    ability: string;
    attackBonus: number;
    saveDC: number;
    slots: number[];
    cantripsKnown: number;
    spellsKnown: number;
  };
}
```

### Rules Configuration (rules.json)
```json
{
  "formulas": {
    "proficiencyBonus": "1 + ceil(totalLevel / 4)",
    "abilityModifier": "floor((score - 10) / 2)",
    "passivePerception": "10 + perception",
    "spellSaveDC": "8 + proficiencyBonus + spellcastingModifier",
    "spellAttackBonus": "proficiencyBonus + spellcastingModifier"
  },
  "abilityScoreMethods": {
    "pointBuy": {
      "points": 27,
      "min": 8,
      "max": 15,
      "costs": {"8": 0, "9": 1, "10": 2, "11": 3, "12": 4, "13": 5, "14": 7, "15": 9}
    },
    "standardArray": [15, 14, 13, 12, 10, 8],
    "roll": {
      "dice": "4d6",
      "keep": "highest 3",
      "times": 6
    }
  },
  "abilities": ["str", "dex", "con", "int", "wis", "cha"],
  "skills": {
    "acrobatics": {"ability": "dex"},
    "animalHandling": {"ability": "wis"},
    "arcana": {"ability": "int"},
    "athletics": {"ability": "str"},
    "deception": {"ability": "cha"},
    "history": {"ability": "int"},
    "insight": {"ability": "wis"},
    "intimidation": {"ability": "cha"},
    "investigation": {"ability": "int"},
    "medicine": {"ability": "wis"},
    "nature": {"ability": "int"},
    "perception": {"ability": "wis"},
    "performance": {"ability": "cha"},
    "persuasion": {"ability": "cha"},
    "religion": {"ability": "int"},
    "sleightOfHand": {"ability": "dex"},
    "stealth": {"ability": "dex"},
    "survival": {"ability": "wis"}
  }
}
```

## Module Specifications

### CharacterCalculator

Pure function that computes derived character data.

```typescript
// Main entry point
function computeCharacter(
  state: CharacterState, 
  data: GameData,
  rules: RulesConfig
): ComputedCharacter;

// Internal helpers
function computeAbilityScores(base: AbilityScores, race: Race): AbilityScores;
function computeProficiencyBonus(totalLevel: number, rules: RulesConfig): number;
function computeSavingThrows(abilities: AbilityScores, classes: ClassLevel[], data: GameData): SaveMap;
function computeSkills(abilities: AbilityScores, proficiencies: string[], expertise: string[]): SkillMap;
function computeFeatures(classes: ClassLevel[], race: Race, background: Background, data: GameData): Feature[];
function computeSpellcasting(classes: ClassLevel[], data: GameData): SpellcastingInfo | null;
function computeHP(classes: ClassLevel[], conMod: number, data: GameData): HPInfo;
```

### FormulaEvaluator

Safe expression evaluation for data-defined formulas.

```typescript
class FormulaEvaluator {
  constructor(tables: Record<string, any>);
  
  evaluate(formula: string, context: Record<string, number>): number;
  
  // Supported operations:
  // Arithmetic: +, -, *, /, %
  // Functions: floor, ceil, round, min, max, abs
  // Lookup: lookup(tableName, key)
  // Comparison: >, <, >=, <=, ==, != (returns 1 or 0)
  // Ternary: condition ? valueIfTrue : valueIfFalse
}
```

### ValidationEngine

Enforces constraints defined in game data.

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
  constraint: string;
}

class ValidationEngine {
  validateCharacter(state: CharacterState, data: GameData): ValidationResult;
  validateChoice(featureId: string, choice: string | string[], data: GameData): ValidationResult;
  getValidChoices(featureId: string, state: CharacterState, data: GameData): string[];
}
```

## Build Pipeline

### Data Transformation Script

```bash
npm run build:data
```

1. Fetch latest from 5etools source (or use cached)
2. Parse and validate against 5etools schema
3. Transform into optimized format:
   - Flatten nested structures
   - Create lookup indices
   - Extract choice options into separate arrays
   - Generate search indices
4. Output to `/public/data/`
5. Generate `data-manifest.json` with version hashes

### Output Structure
```
/public/data/
  ├── manifest.json        # Version info, file hashes
  ├── races.json           # Indexed by race key
  ├── classes.json         # Indexed by class key
  ├── class-features.json  # Indexed by class + level
  ├── backgrounds.json
  ├── feats.json
  ├── spells.json          # Indexed by spell key
  ├── items.json
  └── rules.json           # Formulas, tables, constants
```

## UI Component Structure

```
/src/components/
  ├── creation/
  │   ├── CreationWizard.tsx
  │   ├── RaceStep.tsx
  │   ├── ClassStep.tsx
  │   ├── AbilitiesStep.tsx
  │   ├── BackgroundStep.tsx
  │   └── ReviewStep.tsx
  ├── sheet/
  │   ├── CharacterSheet.tsx
  │   ├── SheetHeader.tsx
  │   ├── AbilitiesPanel.tsx
  │   ├── SkillsPanel.tsx
  │   ├── FeaturesPanel.tsx
  │   ├── SpellsPanel.tsx
  │   └── InventoryPanel.tsx
  ├── levelup/
  │   ├── LevelUpModal.tsx
  │   └── FeatureChoice.tsx
  ├── common/
  │   ├── DiceRoller.tsx
  │   ├── SearchableSelect.tsx
  │   └── FeatureCard.tsx
  └── layout/
      ├── AppShell.tsx
      ├── Navigation.tsx
      └── CharacterList.tsx
```

## MVP Feature Checklist

### Phase 1 - MVP (4 weeks)
- [ ] Data pipeline from 5etools
- [ ] Character creation wizard (race, class, background, abilities)
- [ ] Point buy and standard array ability scores
- [ ] Character sheet view (read-only computed stats)
- [ ] Level-up for single-class characters
- [ ] Local storage persistence
- [ ] PWA setup with offline support

### Phase 2 - Core Features (3 weeks)
- [ ] Full spellcasting (slots, preparation, rituals)
- [ ] Multiclassing support
- [ ] Equipment management
- [ ] Integrated dice roller
- [ ] Character export (JSON, PDF)
- [ ] Character import

### Phase 3 - Enhanced Features (4 weeks)
- [ ] User accounts and cloud sync
- [ ] Character sharing (read-only links)
- [ ] Campaign/party grouping
- [ ] Homebrew content loading
- [ ] Companion/familiar management
- [ ] Long rest / short rest automation

## Non-Functional Requirements

### Performance
- First contentful paint < 2s
- Time to interactive < 4s
- Character computation < 100ms
- Data cached via service worker

### Accessibility
- WCAG 2.1 AA compliance
- Minimum tap target 44x44px
- High contrast mode support
- Screen reader compatible

### Browser Support
- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Mobile Chrome/Safari

## Open Questions

1. **Multiclass spell slot calculation** - The 5etools data may not have this table; we may need to add it to rules.json
2. **Feature interaction edge cases** - Some class features modify other features; need to determine evaluation order
3. **Homebrew support** - How to validate and load user-provided JSON without security risks?
4. **Image assets** - Should we include race/class artwork? Licensing concerns.

---

*Document Version: 1.0*  
*Last Updated: [Current Date]*  
*Authors: Sarah Chen, Marcus Webb, Dev Patel*
