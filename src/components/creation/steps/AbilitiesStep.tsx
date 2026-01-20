import type { WizardStepProps, AbilityScores } from '../../../types';
import type { AbilityScoreMethodConfig } from '../../../types/gameData';
import { useGameData } from '../../../contexts/GameDataContext';

export function AbilitiesStep({ draft, onUpdate }: WizardStepProps) {
  const { rules } = useGameData();
  
  // Get ability keys from rules data
  const abilityKeys = Object.keys(rules.abilities);
  
  // Get available methods from rules data
  const methodEntries = Object.entries(rules.abilityScoreMethods) as [string, AbilityScoreMethodConfig][];
  
  // Find array-type methods (standard array, heroic array, etc.)
  const arrayMethods = methodEntries.filter(([, config]) => config.type === 'array');

  const handleSelectArrayMethod = (methodKey: string) => {
    const method = rules.abilityScoreMethods[methodKey];
    if (method?.type !== 'array' || !method.values) return;
    
    // Build ability scores object from array values
    // Array values are assigned in order to ability keys from rules.json
    // We cast to AbilityScores because the keys come from rules.abilities at runtime
    const scores: Record<string, number> = {};
    abilityKeys.forEach((ability, index) => {
      scores[ability] = method.values![index] ?? 10;
    });
    
    onUpdate({
      abilityScoreMethod: methodKey,
      // Cast is safe: rules.abilities defines the same keys as AbilityScores
      baseAbilityScores: scores as unknown as AbilityScores,
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-display text-ink-800 mb-2">Set Ability Scores</h2>
      <p className="text-ink-600 mb-6">
        Ability scores define your character's raw capabilities.
      </p>
      
      {/* Array methods (temporary - just these for now) */}
      <div className="mb-4 space-y-2">
        <p className="text-sm font-medium text-ink-700 mb-2">Choose a method:</p>
        {arrayMethods.map(([key, config]) => (
          <button
            key={key}
            onClick={() => handleSelectArrayMethod(key)}
            className={`
              block w-full max-w-md text-left px-4 py-3 rounded border transition-colors
              ${draft.abilityScoreMethod === key
                ? 'border-gold-500 bg-gold-100 text-ink-800'
                : 'border-parchment-400 bg-white text-ink-700 hover:bg-parchment-100'
              }
            `}
          >
            <span className="font-medium">{config.label}</span>
            <span className="text-sm text-ink-500 ml-2">
              ({config.values?.join(', ')})
            </span>
            <p className="text-xs text-ink-500 mt-1">{config.description}</p>
          </button>
        ))}
      </div>
      
      {draft.baseAbilityScores && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-sm text-green-700 mb-2">✓ Ability scores set:</p>
          <div className="flex flex-wrap gap-3 text-sm">
            {abilityKeys.map((ability) => (
              <span key={ability} className="bg-white px-2 py-1 rounded border border-green-300">
                <strong className="uppercase">{ability}</strong>: {draft.baseAbilityScores![ability as keyof AbilityScores]}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <p className="text-xs text-ink-400 mt-4">
        {methodEntries.length} methods available • Point buy and rolling coming soon
      </p>
    </div>
  );
}
