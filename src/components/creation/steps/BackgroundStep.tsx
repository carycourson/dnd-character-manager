import type { WizardStepProps } from '../../../types';
import { useGameData } from '../../../contexts/GameDataContext';

export function BackgroundStep({ draft, onUpdate }: WizardStepProps) {
  const { backgroundList } = useGameData();

  return (
    <div>
      <h2 className="text-2xl font-display text-ink-800 mb-2">Choose Your Background</h2>
      <p className="text-ink-600 mb-6">
        Your background reveals where you came from and your place in the world.
      </p>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-ink-700 mb-1">Background</label>
        <select
          value={draft.backgroundKey || ''}
          onChange={(e) => onUpdate({ backgroundKey: e.target.value })}
          className="w-full max-w-xs px-3 py-2 border border-parchment-400 rounded bg-white text-ink-800"
        >
          <option value="">Select a background...</option>
          {backgroundList.map((bg) => (
            <option key={bg.key} value={bg.key}>
              {bg.name}
            </option>
          ))}
        </select>
      </div>
      
      {draft.backgroundKey && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
          ✓ Selected: <strong>{backgroundList.find(b => b.key === draft.backgroundKey)?.name}</strong>
        </p>
      )}
      
      <p className="text-xs text-ink-400 mt-4">
        {backgroundList.length} backgrounds available • Full selection UI coming soon
      </p>
    </div>
  );
}
