import { useState } from 'react';
import type { AbilityScores } from '../../../../types';
import type { AbilityScoreMethodConfig } from '../../../../types/gameData';
import { useGameData } from '../../../../contexts/GameDataContext';

interface RollPanelProps {
  config: AbilityScoreMethodConfig;
  abilityKeys: string[];
  scores: Record<string, number | null>;
  rolledValues: number[];
  onRoll: (values: number[]) => void;
  onChange: (scores: AbilityScores) => void;
  onPartialChange: (scores: Record<string, number | null>) => void;
}

// Dice rolling logic based on config
function rollDice(config: AbilityScoreMethodConfig): number {
  const roll = config.roll;
  if (!roll) return 10;

  const { dice, sides, keep, reroll, modifier = 0 } = roll;

  // Roll the dice
  let rolls: number[] = [];
  for (let i = 0; i < dice; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }

  // Handle rerolls
  if (reroll && reroll.values) {
    const maxRerolls = reroll.count === -1 ? 100 : reroll.count;
    for (let r = 0; r < maxRerolls; r++) {
      let rerolled = false;
      rolls = rolls.map(roll => {
        if (reroll.values.includes(roll)) {
          rerolled = true;
          return Math.floor(Math.random() * sides) + 1;
        }
        return roll;
      });
      if (!rerolled || reroll.count !== -1) break;
    }
  }

  // Keep highest/lowest
  rolls.sort((a, b) => b - a);
  const kept = keep.highest 
    ? rolls.slice(0, keep.count)
    : rolls.slice(-keep.count);

  return kept.reduce((sum, r) => sum + r, 0) + modifier;
}

function rollForAbility(config: AbilityScoreMethodConfig): number {
  const roll = config.roll;
  if (!roll) return 10;

  const { attempts = 1, attemptsKeep } = roll;

  const attemptResults: number[] = [];
  for (let i = 0; i < attempts; i++) {
    attemptResults.push(rollDice(config));
  }

  if (attemptsKeep) {
    attemptResults.sort((a, b) => b - a);
    return attemptResults.slice(0, attemptsKeep.count)[0];
  }

  return attemptResults[0];
}

export function RollPanel({ config, abilityKeys, scores, rolledValues, onRoll, onChange, onPartialChange }: RollPanelProps) {
  const { rules } = useGameData();
  const [isRolling, setIsRolling] = useState(false);
  
  // Track selected value by INDEX
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  // Track which index is assigned to which ability (ability -> index)
  const [abilityToIndex, setAbilityToIndex] = useState<Record<string, number>>({});

  const assignment = config.assignment || 'user';
  const isStraightAssignment = assignment === 'straight';

  // Compute which indices are currently assigned
  const assignedIndices = new Set(Object.values(abilityToIndex));

  const handleRollAll = () => {
    setIsRolling(true);
    setAbilityToIndex({});
    setSelectedIndex(null);
    
    setTimeout(() => {
      const newValues = abilityKeys.map(() => rollForAbility(config));
      onRoll(newValues);
      
      if (isStraightAssignment) {
        const newScores: Record<string, number> = {};
        const newAbilityToIndex: Record<string, number> = {};
        abilityKeys.forEach((key, index) => {
          newScores[key] = newValues[index];
          newAbilityToIndex[key] = index;
        });
        setAbilityToIndex(newAbilityToIndex);
        onChange(newScores as unknown as AbilityScores);
      } else {
        const clearedScores: Record<string, null> = {};
        abilityKeys.forEach(key => {
          clearedScores[key] = null;
        });
        onPartialChange(clearedScores);
      }
      
      setIsRolling(false);
    }, 500);
  };

  const handleValueClick = (index: number) => {
    if (isStraightAssignment) return;
    if (assignedIndices.has(index)) return;
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  const handleAbilityClick = (abilityKey: string) => {
    if (isStraightAssignment) return;
    
    if (selectedIndex === null) {
      // If clicking an assigned ability with no selection, clear it
      if (scores[abilityKey] !== null && abilityToIndex[abilityKey] !== undefined) {
        const newScores = { ...scores, [abilityKey]: null };
        const newAbilityToIndex = { ...abilityToIndex };
        delete newAbilityToIndex[abilityKey];
        
        setAbilityToIndex(newAbilityToIndex);
        onPartialChange(newScores);
      }
      return;
    }
    
    const valueToAssign = rolledValues[selectedIndex];
    const newScores = { ...scores, [abilityKey]: valueToAssign };
    const newAbilityToIndex = { ...abilityToIndex };
    
    // Overwrite any existing assignment for this ability
    newAbilityToIndex[abilityKey] = selectedIndex;
    
    setAbilityToIndex(newAbilityToIndex);
    setSelectedIndex(null);
    
    const allAssigned = abilityKeys.every(k => newScores[k] !== null);
    if (allAssigned) {
      onChange(newScores as unknown as AbilityScores);
    } else {
      onPartialChange(newScores);
    }
  };

  const allAssigned = abilityKeys.every(k => scores[k] !== null);

  return (
    <div>
      <p className="text-ink-600 mb-4">
        {config.description}
        {!isStraightAssignment && rolledValues.length > 0 && (
          <span className="block text-sm mt-1">Click a rolled value, then click an ability to assign it. Click an assigned ability to clear it.</span>
        )}
      </p>

      <button
        onClick={handleRollAll}
        disabled={isRolling}
        className={`
          mb-6 px-6 py-3 rounded-lg font-bold text-lg transition-all
          ${isRolling
            ? 'bg-parchment-300 text-ink-400 cursor-wait'
            : 'bg-gold-500 hover:bg-gold-600 text-ink-900'
          }
        `}
      >
        {isRolling ? '🎲 Rolling...' : rolledValues.length > 0 ? '🎲 Roll Again' : '🎲 Roll Ability Scores'}
      </button>

      {rolledValues.length > 0 && !isStraightAssignment && (
        <div className="mb-6">
          <p className="text-sm font-medium text-ink-700 mb-2">Rolled Values (click to assign)</p>
          <div className="flex flex-wrap gap-2">
            {rolledValues.map((value, index) => {
              const isAssigned = assignedIndices.has(index);
              const isSelected = selectedIndex === index;
              
              return (
                <button
                  key={index}
                  onClick={() => handleValueClick(index)}
                  disabled={isAssigned}
                  className={`
                    w-12 h-12 rounded-lg font-display text-xl font-bold transition-all
                    ${isAssigned
                      ? 'bg-parchment-200 text-ink-300 cursor-not-allowed'
                      : isSelected
                        ? 'bg-gold-500 text-white ring-2 ring-gold-300 ring-offset-2'
                        : 'bg-white border-2 border-parchment-300 text-ink-700 hover:border-gold-400'
                    }
                  `}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {rolledValues.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {abilityKeys.map((key, index) => {
            const abilityInfo = rules.abilities[key];
            const score = isStraightAssignment ? rolledValues[index] : scores[key];
            const modifier = score !== null ? Math.floor((score - 10) / 2) : null;
            const modifierStr = modifier !== null 
              ? (modifier >= 0 ? `+${modifier}` : `${modifier}`)
              : '';
            
            return (
              <button
                key={key}
                onClick={() => handleAbilityClick(key)}
                disabled={isStraightAssignment}
                className={`
                  flex flex-col items-center p-3 rounded-lg border-2 transition-all
                  ${isStraightAssignment
                    ? 'cursor-default border-green-400 bg-green-50'
                    : selectedIndex !== null
                      ? 'border-gold-400 bg-gold-50 cursor-pointer hover:bg-gold-100'
                      : score !== null
                        ? 'border-green-400 bg-green-50 cursor-pointer hover:bg-green-100'
                        : 'border-parchment-300 bg-white cursor-pointer hover:border-parchment-400'
                  }
                `}
              >
                <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">
                  {abilityInfo?.name || key}
                </span>
                <span className="text-3xl font-display text-ink-800 my-2">
                  {score ?? '?'}
                </span>
                {modifier !== null && (
                  <span className={`
                    text-sm font-bold px-2 py-0.5 rounded
                    ${modifier >= 0 ? 'bg-green-100 text-green-700' : 'bg-blood-100 text-blood-700'}
                  `}>
                    {modifierStr}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {allAssigned && (
        <p className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
          ✓ All abilities assigned!
        </p>
      )}
    </div>
  );
}
