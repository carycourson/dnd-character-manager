import type { WizardStepProps } from '../../../types';
import { useGameData } from '../../../contexts/GameDataContext';

export function ClassStep({ draft, onUpdate }: WizardStepProps) {
  const { classList } = useGameData();

  return (
    <div>
      <h2 className="text-2xl font-display text-ink-800 mb-2">Choose Your Class</h2>
      <p className="text-ink-600 mb-6">
        Your class defines your character's abilities, skills, and role in the party.
      </p>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-ink-700 mb-1">Class</label>
        <select
          value={draft.classKey || ''}
          onChange={(e) => onUpdate({ classKey: e.target.value })}
          className="w-full max-w-xs px-3 py-2 border border-parchment-400 rounded bg-white text-ink-800"
        >
          <option value="">Select a class...</option>
          {classList.map((cls) => (
            <option key={cls.key} value={cls.key}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>
      
      {draft.classKey && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
          ✓ Selected: <strong>{classList.find(c => c.key === draft.classKey)?.name}</strong>
        </p>
      )}
      
      <p className="text-xs text-ink-400 mt-4">
        {classList.length} classes available • Full selection UI coming soon
      </p>
    </div>
  );
}
