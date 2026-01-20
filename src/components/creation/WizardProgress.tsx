import type { CreationStep, CharacterDraft } from '../../types';
import { 
  isRaceStepComplete, 
  isClassStepComplete, 
  isAbilitiesStepComplete, 
  isBackgroundStepComplete 
} from '../../types';

interface WizardProgressProps {
  currentStep: CreationStep;
  draft: CharacterDraft;
  onStepClick: (step: CreationStep) => void;
}

const STEPS: { key: CreationStep; label: string; icon: string }[] = [
  { key: 'race', label: 'Race', icon: '🧝' },
  { key: 'class', label: 'Class', icon: '⚔️' },
  { key: 'abilities', label: 'Abilities', icon: '💪' },
  { key: 'background', label: 'Background', icon: '📜' },
  { key: 'review', label: 'Review', icon: '✨' },
];

function isStepComplete(draft: CharacterDraft, step: CreationStep): boolean {
  switch (step) {
    case 'race': return isRaceStepComplete(draft);
    case 'class': return isClassStepComplete(draft);
    case 'abilities': return isAbilitiesStepComplete(draft);
    case 'background': return isBackgroundStepComplete(draft);
    case 'review': return false; // Review is never "complete" until character is created
    default: return false;
  }
}

function canClickStep(draft: CharacterDraft, targetStep: CreationStep, currentStep: CreationStep): boolean {
  const stepOrder: CreationStep[] = ['race', 'class', 'abilities', 'background', 'review'];
  const targetIndex = stepOrder.indexOf(targetStep);
  const currentIndex = stepOrder.indexOf(currentStep);
  
  // Can always go back
  if (targetIndex <= currentIndex) return true;
  
  // Can only go forward if all previous steps are complete
  for (let i = 0; i < targetIndex; i++) {
    if (!isStepComplete(draft, stepOrder[i])) return false;
  }
  return true;
}

export function WizardProgress({ currentStep, draft, onStepClick }: WizardProgressProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, index) => {
        const isActive = step.key === currentStep;
        const isComplete = isStepComplete(draft, step.key);
        const canClick = canClickStep(draft, step.key, currentStep);
        
        return (
          <div key={step.key} className="flex items-center flex-1">
            {/* Step circle */}
            <button
              onClick={() => canClick && onStepClick(step.key)}
              disabled={!canClick}
              className={`
                flex flex-col items-center gap-1 p-2 rounded-lg transition-all
                ${canClick ? 'cursor-pointer hover:bg-parchment-200' : 'cursor-not-allowed'}
                ${isActive ? 'bg-gold-100' : ''}
              `}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-lg
                border-2 transition-colors
                ${isActive 
                  ? 'border-gold-500 bg-gold-500 text-white' 
                  : isComplete
                    ? 'border-green-500 bg-green-500 text-white'
                    : canClick
                      ? 'border-parchment-400 bg-parchment-100 text-ink-600'
                      : 'border-parchment-300 bg-parchment-50 text-ink-400'
                }
              `}>
                {isComplete && !isActive ? '✓' : step.icon}
              </div>
              <span className={`
                text-xs font-medium
                ${isActive ? 'text-gold-700' : isComplete ? 'text-green-700' : 'text-ink-500'}
              `}>
                {step.label}
              </span>
            </button>
            
            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div className={`
                flex-1 h-0.5 mx-2
                ${isComplete ? 'bg-green-400' : 'bg-parchment-300'}
              `} />
            )}
          </div>
        );
      })}
    </div>
  );
}