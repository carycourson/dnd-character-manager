import type { WizardStepProps } from '../../../types';
import { useGameData } from '../../../contexts/GameDataContext';

export function RaceStep({ draft, onUpdate }: WizardStepProps) {
  const { raceList } = useGameData();

  return (
    <div>
      <h2 className="text-2xl font-display text-ink-800 mb-2">Choose Your Race</h2>
      <p className="text-ink-600 mb-6">
        Your race determines your character's physical traits, innate abilities, and cultural background.
      </p>
      
      {/* Temporary: Simple select for now, will be replaced with full UI */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-ink-700 mb-1">Race</label>
        <select
          value={draft.raceKey || ''}
          onChange={(e) => onUpdate({ raceKey: e.target.value, subraceKey: undefined })}
          className="w-full max-w-xs px-3 py-2 border border-parchment-400 rounded bg-white text-ink-800"
        >
          <option value="">Select a race...</option>
          {raceList.map((race) => (
            <option key={race.key} value={race.key}>
              {race.name}
            </option>
          ))}
        </select>
      </div>
      
      {draft.raceKey && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
          ✓ Selected: <strong>{raceList.find(r => r.key === draft.raceKey)?.name}</strong>
        </p>
      )}
      
      <p className="text-xs text-ink-400 mt-4">
        {raceList.length} races available • Full selection UI coming soon
      </p>
    </div>
  );
}
