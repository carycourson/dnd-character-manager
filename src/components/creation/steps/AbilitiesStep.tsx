import { useState, useEffect } from 'react';
import type { WizardStepProps, AbilityScores } from '../../../types';
import type { AbilityScoreMethodConfig } from '../../../types/gameData';
import { useGameData } from '../../../contexts/GameDataContext';
import { 
  MethodSelector, 
  PointBuyPanel, 
  ArrayAssignPanel, 
  ManualEntryPanel,
  RollPanel 
} from './abilities';

type MethodType = 'roll' | 'array' | 'pointBuy' | 'manual';

export function AbilitiesStep({ draft, onUpdate }: WizardStepProps) {
  const { rules } = useGameData();
  
  const abilityKeys = Object.keys(rules.abilities);
  const methodEntries = Object.entries(rules.abilityScoreMethods) as [string, AbilityScoreMethodConfig][];
  
  // Local state for method selection
  const [selectedType, setSelectedType] = useState<MethodType | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(draft.abilityScoreMethod || null);
  const [localScores, setLocalScores] = useState<Record<string, number | null>>(() => {
    if (draft.baseAbilityScores) {
      return { ...draft.baseAbilityScores };
    }
    // Initialize with nulls
    const initial: Record<string, number | null> = {};
    abilityKeys.forEach(k => initial[k] = null);
    return initial;
  });
  const [rolledValues, setRolledValues] = useState<number[]>(draft.rolledScores || []);

  // Sync selected type from method
  useEffect(() => {
    if (selectedMethod) {
      const config = rules.abilityScoreMethods[selectedMethod];
      if (config) {
        setSelectedType(config.type as MethodType);
      }
    }
  }, [selectedMethod, rules.abilityScoreMethods]);

  const handleSelectType = (type: MethodType) => {
    setSelectedType(type);
    setSelectedMethod(null);
    // Reset scores when changing type
    const initial: Record<string, number | null> = {};
    abilityKeys.forEach(k => initial[k] = null);
    setLocalScores(initial);
    setRolledValues([]);
  };

  const handleSelectMethod = (methodKey: string) => {
    setSelectedMethod(methodKey);
    const config = rules.abilityScoreMethods[methodKey];
    
    // Initialize scores based on method type
    if (config.type === 'pointBuy') {
      // Start at minimum values
      const initial: Record<string, number> = {};
      abilityKeys.forEach(k => initial[k] = config.min || 8);
      setLocalScores(initial);
    } else if (config.type === 'manual') {
      // Start at 10
      const initial: Record<string, number> = {};
      abilityKeys.forEach(k => initial[k] = 10);
      setLocalScores(initial);
    } else {
      // Arrays and rolls start with null
      const initial: Record<string, number | null> = {};
      abilityKeys.forEach(k => initial[k] = null);
      setLocalScores(initial);
    }
    setRolledValues([]);
  };

  // Called when all scores are complete
  const handleScoresChange = (scores: AbilityScores) => {
    setLocalScores(scores);
    onUpdate({
      abilityScoreMethod: selectedMethod || undefined,
      baseAbilityScores: scores,
      rolledScores: rolledValues.length > 0 ? rolledValues : undefined,
    });
  };

  // Called during partial assignment (not all scores set yet)
  const handlePartialChange = (scores: Record<string, number | null>) => {
    setLocalScores(scores);
    // Don't update draft until complete
  };

  const handleRoll = (values: number[]) => {
    setRolledValues(values);
  };

  const selectedConfig = selectedMethod ? rules.abilityScoreMethods[selectedMethod] : null;

  // Check if step is complete
  const isComplete = !!(
    selectedMethod && 
    draft.baseAbilityScores && 
    abilityKeys.every(k => draft.baseAbilityScores![k as keyof AbilityScores] !== null)
  );

  return (
    <div>
      <h2 className="text-2xl font-display text-ink-800 mb-2">Set Ability Scores</h2>
      <p className="text-ink-600 mb-6">
        Ability scores define your character's raw capabilities. Choose a method to determine your scores.
      </p>
      
      {/* Method selection */}
      <div className="mb-8">
        <MethodSelector
          methods={methodEntries}
          selectedType={selectedType}
          selectedMethod={selectedMethod}
          onSelectType={handleSelectType}
          onSelectMethod={handleSelectMethod}
        />
      </div>

      {/* Method-specific panel */}
      {selectedConfig && (
        <div className="p-4 bg-parchment-50 rounded-lg border border-parchment-300">
          {selectedConfig.type === 'pointBuy' && (
            <PointBuyPanel
              config={selectedConfig}
              abilityKeys={abilityKeys}
              scores={localScores as Record<string, number>}
              onChange={handleScoresChange}
            />
          )}
          
          {selectedConfig.type === 'array' && (
            <ArrayAssignPanel
              config={selectedConfig}
              abilityKeys={abilityKeys}
              scores={localScores}
              onChange={handleScoresChange}
              onPartialChange={handlePartialChange}
            />
          )}
          
          {selectedConfig.type === 'manual' && (
            <ManualEntryPanel
              config={selectedConfig}
              abilityKeys={abilityKeys}
              scores={localScores as Record<string, number>}
              onChange={handleScoresChange}
            />
          )}
          
          {selectedConfig.type === 'roll' && (
            <RollPanel
              config={selectedConfig}
              abilityKeys={abilityKeys}
              scores={localScores}
              rolledValues={rolledValues}
              onRoll={handleRoll}
              onChange={handleScoresChange}
              onPartialChange={handlePartialChange}
            />
          )}
        </div>
      )}

      {/* Completion indicator */}
      {isComplete && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-medium">✓ Ability scores set! You can proceed to the next step.</p>
        </div>
      )}
    </div>
  );
}