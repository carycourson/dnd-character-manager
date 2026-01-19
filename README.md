# D&D 5E Character Manager

A Progressive Web App for creating, managing, and advancing Dungeons & Dragons 5th Edition characters. Built with a data-driven architecture that derives all game rules from external JSON data sources.

## 🎯 Design Philosophy

**Zero Hardcoding**: The codebase contains no hardcoded game content. All races, classes, spells, items, and rules are loaded from JSON data files derived from the [5etools data repository](https://github.com/carycourson/2014-5e-tools-src).

**Data-Driven Engine**: A pure-function rules engine (`CharacterCalculator`) computes all derived statistics by interpreting data definitions. Formulas for ability modifiers, proficiency bonuses, and other calculations are defined in JSON, not code.

**Offline-First**: As a PWA, the app works fully offline after initial load. All game data is cached via service workers.

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React UI Layer                          │
│  (Creation Wizard | Character Sheet | Level-Up Flow)        │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│              State Management (Zustand)                      │
│  (characterStore | uiStore | dataStore)                     │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                 Core Engine Layer                            │
│  CharacterCalculator | FormulaEvaluator | ValidationEngine  │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    Data Layer                                │
│  DataLoader (React Query) | StorageAdapter (IndexedDB)      │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/dnd-5e-character-manager.git
cd dnd-5e-character-manager

# Install dependencies
npm install

# Build game data from 5etools source
npm run build:data

# Start development server
npm run dev
```

### Building for Production

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
dnd-character-manager/
├── docs/
│   └── ARCHITECTURE.md        # Detailed architecture document
├── public/
│   └── data/
│       ├── rules.json         # Game formulas and constants
│       ├── races.json         # Race definitions (generated)
│       ├── classes.json       # Class definitions (generated)
│       └── ...                # Other game data (generated)
├── src/
│   ├── components/
│   │   ├── creation/          # Character creation wizard
│   │   ├── sheet/             # Character sheet components
│   │   ├── levelup/           # Level-up flow
│   │   ├── common/            # Shared UI components
│   │   └── layout/            # App shell and navigation
│   ├── engine/
│   │   └── CharacterCalculator.ts  # Core rules engine
│   ├── stores/                # Zustand state stores
│   ├── hooks/                 # Custom React hooks
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   └── utils/                 # Utility functions
├── tools/
│   └── build-data.js          # 5etools data transformation script
└── tests/                     # Test files
```

## 🎮 Features

### MVP (Phase 1)
- [x] Data-driven architecture
- [ ] Character creation (race, class, background, abilities)
- [ ] Point buy and standard array ability scores
- [ ] Character sheet view
- [ ] Single-class level-up (1-20)
- [ ] Local storage persistence
- [ ] Offline support

### Phase 2
- [ ] Full spellcasting (slots, preparation, rituals)
- [ ] Multiclassing
- [ ] Equipment management
- [ ] Dice roller integration
- [ ] Character export (JSON, PDF)

### Phase 3
- [ ] Cloud sync and accounts
- [ ] Character sharing
- [ ] Campaign/party features
- [ ] Homebrew content support

## 🔧 Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Tailwind CSS | Styling |
| Zustand | State Management |
| React Query | Data Fetching/Caching |
| Dexie.js | IndexedDB Wrapper |
| Vite | Build Tool |
| math.js | Formula Evaluation |
| Vitest | Testing |

## 📊 Data Flow

### Game Data (Read-Only)
```
5etools Repo → build-data.js → /public/data/ → Service Worker → React Query → UI
```

### Character Data (Read-Write)
```
UI → Zustand → CharacterCalculator → Computed View
         ↓
    IndexedDB (async)
```

## 🧮 The Rules Engine

The `CharacterCalculator` is the heart of the application. It's a pure function that takes:
- `CharacterState` - The user's saved character data
- `GameData` - All loaded game content and rules

And returns a `ComputedCharacter` with all derived statistics.

```typescript
const computed = computeCharacter(characterState, gameData);
// computed.abilityScores - Final scores with racial bonuses
// computed.skills - All skill modifiers and proficiencies  
// computed.hp - Max, current, temp HP and hit dice
// computed.features - All features from race/class/background
// computed.spellcasting - Spell slots, save DC, attack bonus
```

### Formula System

Game formulas are defined in JSON and evaluated at runtime:

```json
{
  "formulas": {
    "proficiencyBonus": "1 + ceil(totalLevel / 4)",
    "abilityModifier": "floor((score - 10) / 2)",
    "spellSaveDC": "8 + proficiencyBonus + spellcastingModifier"
  }
}
```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 🙏 Acknowledgments

- [5etools](https://5e.tools/) for the comprehensive D&D 5E data
- The D&D community for inspiration and feedback

---

*This is a fan project and is not affiliated with, endorsed, sponsored, or specifically approved by Wizards of the Coast LLC.*
