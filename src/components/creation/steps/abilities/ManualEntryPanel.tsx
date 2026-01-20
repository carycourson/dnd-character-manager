import type { AbilityScores } from '../../../../types';
import type { AbilityScoreMethodConfig } from '../../../../types/gameData';
import { AbilityScoreCard } from './AbilityScoreCard';

interface ManualEntryPanelProps {
  config: AbilityScoreMethodConfig;
  abilityKeys: string[];
  scores: Record<string, number>;
  onChange: (scores: AbilityScores) => void;
}

export function ManualEntryPanel({ config, abilityKeys, scores, onChange }: ManualEntryPanelProps) {
  const { min = 1, max = 30 } = config;

  const handleScoreChange = (abilityKey: string, newScore: number) => {
    const newScores = { ...scores, [abilityKey]: newScore };
    onChange(newScores as unknown as AbilityScores);
  };

  return (
    <div>
      <p className="text-ink-600 mb-4">
        Enter ability scores directly. Valid range: {min}–{max}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {abilityKeys.map((key) => (
          <AbilityScoreCard
            key={key}
            abilityKey={key}
            score={scores[key] ?? 10}
            min={min}
            max={max}
            editable={true}
            onChange={(newScore) => handleScoreChange(key, newScore)}
          />
        ))}
      </div>
    </div>
  );
}
