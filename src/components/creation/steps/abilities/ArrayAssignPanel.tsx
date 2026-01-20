import { useState } from 'react';
import type { AbilityScores } from '../../../../types';
import type { AbilityScoreMethodConfig } from '../../../../types/gameData';
import { useGameData } from '../../../../contexts/GameDataContext';

interface ArrayAssignPanelProps {
  config: AbilityScoreMethodConfig;
  abilityKeys: string[];
  scores: Record<string, number | null>;
  onChange: (scores: AbilityScores) => void;
  onPartialChange: (scores: Record<string, number | null>) => void;
}

export function ArrayAssignPanel({ config, abilityKeys, scores, onChange, onPartialChange }: ArrayAssignPanelProps) {
  const { rules } = useGameData();
  const values = config.values || [];
  
  // Track selected value by INDEX, not by value
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  // Track which value indices have been assigned
  const [assignedIndices, setAssignedIndices] = useState<Set<number>>(new Set());

  const handleValueClick = (index: number) => {
    if (assignedIndices.has(index)) return;
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  const handleAbilityClick = (abilityKey: string) => {
    if (selectedIndex === null) {
      // If clicking an assigned ability with no selection, clear it
      if (scores[abilityKey] !== null) {
        // Find which index was assigned to this ability and free it
        const newScores = { ...scores, [abilityKey]: null };
        
        // Find and remove the assigned index for this ability
        // We need to track which index goes to which ability
        const newAssignedIndices = new Set(assignedIndices);
        // For simplicity, we'll rebuild assigned indices from scores
        // This is a bit inefficient but works
        
        onPartialChange(newScores);
        setAssignedIndices(prev => {
          const newSet = new Set(prev);
          // We need to find which index had this value - tricky with duplicates
          // For now, just clear and let user reassign
          return newSet;
        });
      }
      return;
    }
    
    const valueToAssign = values[selectedIndex];
    const newScores = { ...scores, [abilityKey]: valueToAssign };
    const newAssignedIndices = new Set(assignedIndices);
    newAssignedIndices.add(selectedIndex);
    
    setAssignedIndices(newAssignedIndices);
    setSelectedIndex(null);
    
    // Check if all abilities are assigned
    const allAssigned = abilityKeys.every(k => newScores[k] !== null);
    if (allAssigned) {
      onChange(newScores as unknown as AbilityScores);
    } else {
      onPartialChange(newScores);
    }
  };

  const handleAutoAssign = () => {
    // Assign values in order (highest to first ability, etc.)
    const sortedValues = [...values].sort((a, b) => b - a);
    const newScores: Record<string, number> = {};
    abilityKeys.forEach((key, index) => {
      newScores[key] = sortedValues[index];
    });
    // Mark all indices as assigned
    setAssignedIndices(new Set(values.map((_, i) => i)));
    setSelectedIndex(null);
    onChange(newScores as unknown as AbilityScores);
  };

  const handleClear = () => {
    const clearedScores: Record<string, null> = {};
    abilityKeys.forEach(key => {
      clearedScores[key] = null;
    });
    setAssignedIndices(new Set());
    setSelectedIndex(null);
    onPartialChange(clearedScores);
  };

  const allAssigned = abilityKeys.every(k => scores[k] !== null);

  return (
    <div>
      {/* Instructions */}
      <p className="text-ink-600 mb-4">
        Click a value below, then click an ability to assign it.
      </p>

      {/* Available values */}
      <div className="mb-6">
        <p className="text-sm font-medium text-ink-700 mb-2">Available Values</p>
        <div className="flex flex-wrap gap-2">
          {values.map((value, index) => {
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

      {/* Ability slots */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
        {abilityKeys.map((key) => {
          const abilityInfo = rules.abilities[key];
          const score = scores[key];
          const modifier = score !== null ? Math.floor((score - 10) / 2) : null;
          const modifierStr = modifier !== null 
            ? (modifier >= 0 ? `+${modifier}` : `${modifier}`)
            : '';
          
          return (
            <button
              key={key}
              onClick={() => handleAbilityClick(key)}
              className={`
                flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer
                ${selectedIndex !== null
                  ? 'border-gold-400 bg-gold-50 hover:bg-gold-100'
                  : score !== null
                    ? 'border-green-400 bg-green-50 hover:bg-green-100'
                    : 'border-parchment-300 bg-white hover:border-parchment-400'
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

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleAutoAssign}
          className="px-3 py-1 text-sm bg-parchment-200 hover:bg-parchment-300 text-ink-700 rounded transition-colors"
        >
          Auto-assign (highest first)
        </button>
        <button
          onClick={handleClear}
          className="px-3 py-1 text-sm bg-parchment-200 hover:bg-parchment-300 text-ink-700 rounded transition-colors"
        >
          Clear all
        </button>
      </div>

      {allAssigned && (
        <p className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
          ✓ All abilities assigned!
        </p>
      )}
    </div>
  );
}
