'use client';

import { FC } from 'react';

import { GhostButton, OutlinedButton, PrimaryButton, Step, StepStatus } from '@epam/ai-dial-ui-kit';
import { IconArrowNarrowLeft, IconArrowNarrowRight } from '@tabler/icons-react';
import classNames from 'classnames';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  steps: Step[];
  currentStep?: Step;
  finishButtonLabel?: string;
  onChangeStep: (id: string) => void;
  onFinishClick: () => void;
  onClose: () => void;
  onNextStep?: () => void;
  isLoading?: boolean;
  isLastStepInformative?: boolean;
}

const StepperModalButtons: FC<Props> = ({
  steps,
  currentStep,
  finishButtonLabel,
  onChangeStep,
  onFinishClick,
  onClose,
  onNextStep,
  isLoading,
  isLastStepInformative,
}) => {
  const t = useI18n();

  const onDefaultNextStep = () => {
    const stepIndex = steps.findIndex((s) => s.id === currentStep?.id);
    onChangeStep(steps[stepIndex + 1]?.id as string);
  };

  const handleNextStep = onNextStep ?? onDefaultNextStep;

  const onPrevStep = () => {
    const stepIndex = steps.findIndex((s) => s.id === currentStep?.id);
    onChangeStep(steps[stepIndex - 1]?.id as string);
  };

  const isInformativeStep = !!isLastStepInformative && currentStep?.id === steps.at(-1)?.id;
  const finishStepId = isLastStepInformative ? steps.at(-2)?.id : steps.at(-1)?.id;
  const isFinishStep = currentStep?.id === finishStepId;
  const stepsToComplete = isLastStepInformative ? steps.slice(0, -1) : steps;
  const isFirstStep = currentStep?.id === steps[0]?.id;

  if (isInformativeStep) {
    return (
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <PrimaryButton label={t(ButtonsI18nKey.Close)} onClick={onClose} />
      </div>
    );
  }

  return (
    <div
      className={classNames(
        'flex flex-row items-center gap-2 px-6 py-4',
        isFirstStep ? 'justify-end' : 'justify-between',
      )}
    >
      {!isFirstStep && (
        <GhostButton
          label={t(ButtonsI18nKey.Back)}
          onClick={onPrevStep}
          iconBefore={<IconArrowNarrowLeft {...BASE_BUTTON_ICON_PROPS} />}
        />
      )}

      <div className="flex gap-2">
        <OutlinedButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        {!isFinishStep && (
          <PrimaryButton
            label={t(ButtonsI18nKey.Next)}
            onClick={handleNextStep}
            iconAfter={<IconArrowNarrowRight {...BASE_BUTTON_ICON_PROPS} />}
            disabled={currentStep?.status !== StepStatus.VALID || !!isLoading}
          />
        )}
        {isFinishStep && (
          <PrimaryButton
            label={finishButtonLabel || t(ButtonsI18nKey.Finish)}
            disabled={stepsToComplete.some((s) => s.status !== StepStatus.VALID) || !!isLoading}
            onClick={onFinishClick}
          />
        )}
      </div>
    </div>
  );
};

export default StepperModalButtons;
