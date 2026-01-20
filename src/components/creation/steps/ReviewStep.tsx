import type { WizardStepProps } from '../../../types';
import { useGameData } from '../../../contexts/GameDataContext';

export function ReviewStep({ draft, onUpdate }: WizardStepProps) {
  const { races, classes, backgrounds } = useGameData();
  
  const race = draft.raceKey ? races[draft.raceKey] : null;
  const cls = draft.classKey ? classes[draft.classKey] : null;
  const background = draft.backgroundKey ? backgrounds[draft.backgroundKey] : null;

  return (
    <div>
      <h2 className="text-2xl font-display text-ink-800 mb-2">Review Your Character</h2>
      <p className="text-ink-600 mb-6">
        Give your character a name and review your choices before creating.
      </p>
      
      {/* Character Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-ink-700 mb-1">
          Character Name <span className="text-blood-500">*</span>
        </label>
        <input
          type="text"
          value={draft.name || ''}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Enter character name..."
          className="w-full max-w-sm px-3 py-2 border border-parchment-400 rounded bg-white text-ink-800 focus:border-gold-500 focus:outline-none"
        />
      </div>
      
      {/* Summary */}
      <div className="bg-parchment-100 border border-parchment-300 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-parchment-300">
          <span className="text-ink-600">Race</span>
          <span className="font-medium text-ink-800">{race?.name || '—'}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-parchment-300">
          <span className="text-ink-600">Class</span>
          <span className="font-medium text-ink-800">{cls?.name || '—'} (Level 1)</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-parchment-300">
          <span className="text-ink-600">Background</span>
          <span className="font-medium text-ink-800">{background?.name || '—'}</span>
        </div>
        <div className="py-2">
          <span className="text-ink-600 block mb-2">Ability Scores</span>
          {draft.baseAbilityScores ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(draft.baseAbilityScores).map(([ability, score]) => (
                <span key={ability} className="bg-white px-2 py-1 rounded border border-parchment-300 text-sm">
                  <strong className="uppercase">{ability}</strong>: {score}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-ink-400">—</span>
          )}
        </div>
      </div>
      
      {!draft.name && (
        <p className="text-sm text-blood-600 mt-4">
          ⚠️ Please enter a character name to create your character.
        </p>
      )}
    </div>
  );
}
