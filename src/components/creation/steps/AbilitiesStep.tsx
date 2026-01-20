import type { WizardStepProps } from '../../../types';

const DEFAULT_SCORES = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

export function AbilitiesStep({ draft, onUpdate }: WizardStepProps) {
  const handleSetStandardArray = () => {
    onUpdate({
      abilityScoreMethod: 'standard_array',
      baseAbilityScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-display text-ink-800 mb-2">Set Ability Scores</h2>
      <p className="text-ink-600 mb-6">
        Ability scores define your character's raw capabilities.
      </p>
      
      {/* Temporary: Just standard array for now */}
      <div className="mb-4">
        <button
          onClick={handleSetStandardArray}
          className={`
            px-4 py-2 rounded border transition-colors
            ${draft.abilityScoreMethod === 'standard_array'
              ? 'border-gold-500 bg-gold-100 text-ink-800'
              : 'border-parchment-400 bg-white text-ink-700 hover:bg-parchment-100'
            }
          `}
        >
          Use Standard Array (15, 14, 13, 12, 10, 8)
        </button>
      </div>
      
      {draft.baseAbilityScores && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-sm text-green-700 mb-2">✓ Ability scores set:</p>
          <div className="flex flex-wrap gap-3 text-sm">
            {Object.entries(draft.baseAbilityScores).map(([ability, score]) => (
              <span key={ability} className="bg-white px-2 py-1 rounded border border-green-300">
                <strong className="uppercase">{ability}</strong>: {score}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <p className="text-xs text-ink-400 mt-4">
        Point buy, rolling, and other methods coming soon
      </p>
    </div>
  );
}
