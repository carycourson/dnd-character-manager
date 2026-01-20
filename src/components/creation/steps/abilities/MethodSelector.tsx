import type { AbilityScoreMethodConfig } from '../../../../types/gameData';

type MethodType = 'roll' | 'array' | 'pointBuy' | 'manual';

interface MethodSelectorProps {
  methods: [string, AbilityScoreMethodConfig][];
  selectedType: MethodType | null;
  selectedMethod: string | null;
  onSelectType: (type: MethodType) => void;
  onSelectMethod: (methodKey: string) => void;
}

const METHOD_TYPE_INFO: Record<MethodType, { label: string; icon: string; description: string }> = {
  roll: { 
    label: 'Roll', 
    icon: '🎲', 
    description: 'Roll dice for random scores' 
  },
  array: { 
    label: 'Array', 
    icon: '📊', 
    description: 'Assign fixed values to abilities' 
  },
  pointBuy: { 
    label: 'Point Buy', 
    icon: '🛒', 
    description: 'Spend points to customize scores' 
  },
  manual: { 
    label: 'Manual', 
    icon: '✏️', 
    description: 'Enter scores directly' 
  },
};

export function MethodSelector({ 
  methods, 
  selectedType, 
  selectedMethod,
  onSelectType, 
  onSelectMethod 
}: MethodSelectorProps) {
  // Group methods by type
  const methodsByType = methods.reduce((acc, [key, config]) => {
    const type = config.type as MethodType;
    if (!acc[type]) acc[type] = [];
    acc[type].push([key, config] as [string, AbilityScoreMethodConfig]);
    return acc;
  }, {} as Record<MethodType, [string, AbilityScoreMethodConfig][]>);

  const availableTypes = Object.keys(methodsByType) as MethodType[];

  return (
    <div className="space-y-4">
      {/* Type tabs */}
      <div className="flex flex-wrap gap-2">
        {availableTypes.map((type) => {
          const info = METHOD_TYPE_INFO[type];
          const isSelected = selectedType === type;
          
          return (
            <button
              key={type}
              onClick={() => onSelectType(type)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all
                ${isSelected
                  ? 'border-gold-500 bg-gold-100 text-ink-800'
                  : 'border-parchment-300 bg-white text-ink-600 hover:border-parchment-400 hover:bg-parchment-50'
                }
              `}
            >
              <span className="text-lg">{info.icon}</span>
              <span className="font-medium">{info.label}</span>
            </button>
          );
        })}
      </div>

      {/* Method variants within selected type */}
      {selectedType && methodsByType[selectedType] && (
        <div className="pl-2 border-l-2 border-parchment-300">
          <p className="text-sm text-ink-500 mb-2">
            {METHOD_TYPE_INFO[selectedType].description}
          </p>
          <div className="space-y-1">
            {methodsByType[selectedType].map(([key, config]) => (
              <button
                key={key}
                onClick={() => onSelectMethod(key)}
                className={`
                  block w-full text-left px-3 py-2 rounded transition-colors
                  ${selectedMethod === key
                    ? 'bg-gold-200 text-ink-800'
                    : 'hover:bg-parchment-100 text-ink-600'
                  }
                `}
              >
                <span className="font-medium">{config.label}</span>
                <span className="text-sm text-ink-500 ml-2">— {config.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
