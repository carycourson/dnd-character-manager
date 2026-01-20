import type { AbilityScores } from '../../../../types';
import type { AbilityScoreMethodConfig } from '../../../../types/gameData';
import { AbilityScoreCard } from './AbilityScoreCard';

interface PointBuyPanelProps {
  config: AbilityScoreMethodConfig;
  abilityKeys: string[];
  scores: Record<string, number>;
  onChange: (scores: AbilityScores) => void;
}

export function PointBuyPanel({ config, abilityKeys, scores, onChange }: PointBuyPanelProps) {
  const { points: totalPoints = 27, min = 8, max = 15, costs = {} } = config;

  // Calculate points spent
  const pointsSpent = abilityKeys.reduce((sum, key) => {
    const score = scores[key] ?? min;
    return sum + (costs[String(score)] ?? 0);
  }, 0);

  const pointsRemaining = totalPoints - pointsSpent;

  // Get cost to increase a score by 1
  const getCostToIncrease = (currentScore: number): number => {
    if (currentScore >= max) return 0;
    const currentCost = costs[String(currentScore)] ?? 0;
    const nextCost = costs[String(currentScore + 1)] ?? 0;
    return nextCost - currentCost;
  };

  // Check if we can afford to increase a score
  const canIncrease = (currentScore: number): boolean => {
    if (currentScore >= max) return false;
    const cost = getCostToIncrease(currentScore);
    return cost <= pointsRemaining;
  };

  const handleScoreChange = (abilityKey: string, newScore: number) => {
    const newScores = { ...scores, [abilityKey]: newScore };
    onChange(newScores as unknown as AbilityScores);
  };

  return (
    <div>
      {/* Points remaining */}
      <div className="mb-6 p-4 bg-parchment-100 rounded-lg border border-parchment-300">
        <div className="flex items-center justify-between">
          <span className="text-ink-600">Points Remaining</span>
          <span className={`
            text-2xl font-display font-bold
            ${pointsRemaining < 0 
              ? 'text-blood-600' 
              : pointsRemaining === 0 
                ? 'text-green-600' 
                : 'text-ink-800'
            }
          `}>
            {pointsRemaining} / {totalPoints}
          </span>
        </div>
        {pointsRemaining < 0 && (
          <p className="text-sm text-blood-600 mt-2">
            ⚠️ You've spent too many points! Reduce some scores.
          </p>
        )}
        {pointsRemaining > 0 && (
          <p className="text-sm text-ink-500 mt-2">
            You have {pointsRemaining} points left to spend.
          </p>
        )}
      </div>

      {/* Ability score cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {abilityKeys.map((key) => {
          const score = scores[key] ?? min;
          const costToIncrease = getCostToIncrease(score);
          const canAfford = canIncrease(score);
          
          return (
            <AbilityScoreCard
              key={key}
              abilityKey={key}
              score={score}
              min={min}
              max={canAfford ? max : score}  // Prevent increase if can't afford
              editable={true}
              onChange={(newScore) => handleScoreChange(key, newScore)}
              showCost={costToIncrease}
              highlight={score > min}
            />
          );
        })}
      </div>

      {/* Cost reference */}
      <details className="mt-4">
        <summary className="text-sm text-ink-500 cursor-pointer hover:text-ink-700">
          Point cost reference
        </summary>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {Object.entries(costs).map(([score, cost]) => (
            <span key={score} className="bg-parchment-100 px-2 py-1 rounded">
              {score}: {cost} pts
            </span>
          ))}
        </div>
      </details>
    </div>
  );
}
