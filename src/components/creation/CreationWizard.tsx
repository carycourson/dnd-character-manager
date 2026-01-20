import { useState, useCallback } from 'react';
import type { CreationStep, CharacterDraft, CharacterState } from '../../types';
import { WizardProgress } from './WizardProgress';
import { WizardNavigation } from './WizardNavigation';
import { RaceStep, ClassStep, AbilitiesStep, BackgroundStep, ReviewStep } from './steps';
import { saveCharacter, generateCharacterId } from '../../storage';

interface CreationWizardProps {
  onComplete: (characterId: string) => void;
  onCancel: () => void;
}

const STEP_ORDER: CreationStep[] = ['race', 'class', 'abilities', 'background', 'review'];

export function CreationWizard({ onComplete, onCancel }: CreationWizardProps) {
  const [currentStep, setCurrentStep] = useState<CreationStep>('race');
  const [draft, setDraft] = useState<CharacterDraft>({});
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = useCallback((updates: Partial<CharacterDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }));
    setError(null);
  }, []);

  const handleNext = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1]);
    }
  }, [currentStep]);

  const handleStepClick = useCallback((step: CreationStep) => {
    setCurrentStep(step);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!draft.name || !draft.raceKey || !draft.classKey || !draft.backgroundKey || !draft.baseAbilityScores) {
      setError('Please complete all required fields');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const characterState: CharacterState = {
        id: generateCharacterId(),
        name: draft.name,
        playerName: draft.playerName,
        raceKey: draft.raceKey,
        subraceKey: draft.subraceKey,
        classes: [{ classKey: draft.classKey, level: 1 }],
        backgroundKey: draft.backgroundKey,
        baseAbilityScores: draft.baseAbilityScores,
        abilityScoreMethod: draft.abilityScoreMethod || 'manual',
        choices: [
          ...(draft.raceChoices || []),
          ...(draft.classChoices || []),
          ...(draft.backgroundChoices || []),
        ],
        feats: [],
        equipment: [],
        currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
        spellsKnown: [],
        spellsPrepared: [],
        currentHp: 0, // Will be computed
        tempHp: 0,
        hitDiceUsed: {},
        deathSaves: { successes: 0, failures: 0 },
        conditions: [],
        spellSlotsUsed: [],
        alignment: draft.alignment,
        personalityTraits: draft.personalityTraits,
        ideals: draft.ideals,
        bonds: draft.bonds,
        flaws: draft.flaws,
        createdAt: now,
        updatedAt: now,
        dataVersion: '1.0.0',
        appVersion: '0.1.0',
      };

      await saveCharacter(characterState);
      onComplete(characterState.id);
    } catch (err) {
      console.error('Failed to create character:', err);
      setError('Failed to create character. Please try again.');
      setIsCreating(false);
    }
  }, [draft, onComplete]);

  const stepProps = {
    draft,
    onUpdate: handleUpdate,
    onNext: handleNext,
    onBack: handleBack,
  };

  return (
    <div className="bg-parchment-50 rounded-lg border border-parchment-300 p-6">
      <WizardProgress 
        currentStep={currentStep} 
        draft={draft} 
        onStepClick={handleStepClick} 
      />

      <div className="min-h-[300px]">
        {currentStep === 'race' && <RaceStep {...stepProps} />}
        {currentStep === 'class' && <ClassStep {...stepProps} />}
        {currentStep === 'abilities' && <AbilitiesStep {...stepProps} />}
        {currentStep === 'background' && <BackgroundStep {...stepProps} />}
        {currentStep === 'review' && <ReviewStep {...stepProps} />}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-blood-50 border border-blood-300 rounded text-blood-700 text-sm">
          {error}
        </div>
      )}

      <WizardNavigation
        currentStep={currentStep}
        draft={draft}
        onBack={handleBack}
        onNext={handleNext}
        onCreate={handleCreate}
        onCancel={onCancel}
        isCreating={isCreating}
      />
    </div>
  );
}
