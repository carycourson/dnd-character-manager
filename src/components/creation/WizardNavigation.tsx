import type { CreationStep, CharacterDraft } from '../../types';
import { canProceedToStep } from '../../types';

interface WizardNavigationProps {
  currentStep: CreationStep;
  draft: CharacterDraft;
  onBack: () => void;
  onNext: () => void;
  onCreate: () => void;
  onCancel: () => void;
  isCreating?: boolean;
}

const STEP_ORDER: CreationStep[] = ['abilities', 'race', 'class', 'background', 'review'];

export function WizardNavigation({ 
  currentStep, 
  draft, 
  onBack, 
  onNext, 
  onCreate,
  onCancel,
  isCreating = false 
}: WizardNavigationProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentStep === 'review';
  
  const nextStep = !isLastStep ? STEP_ORDER[currentIndex + 1] : null;
  const canGoNext = nextStep ? canProceedToStep(draft, nextStep) : false;
  const canCreate = canProceedToStep(draft, 'review') && !!draft.name;

  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t border-parchment-300">
      <button
        onClick={onCancel}
        className="px-4 py-2 text-ink-600 hover:text-ink-800 hover:bg-parchment-200 rounded transition-colors"
      >
        Cancel
      </button>
      
      <div className="flex gap-3">
        {!isFirstStep && (
          <button
            onClick={onBack}
            className="px-4 py-2 border border-parchment-400 text-ink-700 hover:bg-parchment-200 rounded transition-colors"
          >
            ← Back
          </button>
        )}
        
        {isLastStep ? (
          <button
            onClick={onCreate}
            disabled={!canCreate || isCreating}
            className={`
              px-6 py-2 rounded font-bold transition-colors
              ${canCreate && !isCreating
                ? 'bg-gold-500 hover:bg-gold-600 text-ink-900'
                : 'bg-parchment-300 text-ink-400 cursor-not-allowed'
              }
            `}
          >
            {isCreating ? 'Creating...' : '✨ Create Character'}
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className={`
              px-4 py-2 rounded font-medium transition-colors
              ${canGoNext
                ? 'bg-gold-500 hover:bg-gold-600 text-ink-900'
                : 'bg-parchment-300 text-ink-400 cursor-not-allowed'
              }
            `}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
