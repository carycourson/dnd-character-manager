import { useGameData } from '../../../../contexts/GameDataContext';

interface AbilityScoreCardProps {
  abilityKey: string;
  score: number | null;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  editable?: boolean;
  highlight?: boolean;
  showCost?: number;  // For point buy - shows the cost to increase
}

export function AbilityScoreCard({ 
  abilityKey, 
  score, 
  onChange,
  min = 1,
  max = 30,
  editable = false,
  highlight = false,
  showCost,
}: AbilityScoreCardProps) {
  const { rules } = useGameData();
  
  const abilityInfo = rules.abilities[abilityKey];
  const abilityName = abilityInfo?.name || abilityKey.toUpperCase();
  
  // Calculate modifier: floor((score - 10) / 2)
  const modifier = score !== null ? Math.floor((score - 10) / 2) : null;
  const modifierStr = modifier !== null 
    ? (modifier >= 0 ? `+${modifier}` : `${modifier}`)
    : '—';

  const handleIncrement = () => {
    if (onChange && score !== null && score < max) {
      onChange(score + 1);
    }
  };

  const handleDecrement = () => {
    if (onChange && score !== null && score > min) {
      onChange(score - 1);
    }
  };

  return (
    <div className={`
      flex flex-col items-center p-3 rounded-lg border-2 transition-all
      ${highlight 
        ? 'border-gold-500 bg-gold-50' 
        : 'border-parchment-300 bg-white'
      }
    `}>
      {/* Ability name */}
      <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">
        {abilityName}
      </span>
      
      {/* Score display/input */}
      <div className="flex items-center gap-1 my-2">
        {editable && (
          <button
            onClick={handleDecrement}
            disabled={score === null || score <= min}
            className="w-6 h-6 rounded bg-parchment-200 hover:bg-parchment-300 disabled:opacity-50 disabled:cursor-not-allowed text-ink-600 font-bold"
          >
            −
          </button>
        )}
        
        <span className="text-3xl font-display text-ink-800 w-12 text-center">
          {score ?? '—'}
        </span>
        
        {editable && (
          <button
            onClick={handleIncrement}
            disabled={score === null || score >= max}
            className="w-6 h-6 rounded bg-parchment-200 hover:bg-parchment-300 disabled:opacity-50 disabled:cursor-not-allowed text-ink-600 font-bold"
          >
            +
          </button>
        )}
      </div>
      
      {/* Modifier */}
      <div className={`
        text-sm font-bold px-2 py-0.5 rounded
        ${modifier !== null && modifier >= 0 
          ? 'bg-green-100 text-green-700' 
          : modifier !== null 
            ? 'bg-blood-100 text-blood-700'
            : 'bg-parchment-100 text-ink-400'
        }
      `}>
        {modifierStr}
      </div>
      
      {/* Cost indicator for point buy */}
      {showCost !== undefined && (
        <span className="text-xs text-ink-400 mt-1">
          {showCost > 0 ? `+${showCost} pts` : ''}
        </span>
      )}
    </div>
  );
}
