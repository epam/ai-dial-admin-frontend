'use client';

import { FC } from 'react';

import { DialGhostButton, DialNeutralButton, DialPrimaryButton, Step, StepStatus } from '@epam/ai-dial-ui-kit';
import { IconArrowNarrowLeft } from '@tabler/icons-react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  steps: Step[];
  currentStep?: Step;
  onChangeStep: (id: string) => void;
  onFinishClick: () => void;
  onClose: () => void;
}

const StepperModalButtons: FC<Props> = ({ steps, currentStep, onChangeStep, onFinishClick, onClose }) => {
  const t = useI18n();

  const onNextStep = () => {
    const stepIndex = steps.findIndex((s) => s.id === currentStep?.id);
    onChangeStep(steps[stepIndex + 1]?.id as string);
  };

  const onPrevStep = () => {
    const stepIndex = steps.findIndex((s) => s.id === currentStep?.id);
    onChangeStep(steps[stepIndex - 1]?.id as string);
  };

  return (
    <div className="flex flex-row items-center justify-between gap-2 px-6 py-4">
      <div>
        {currentStep?.id !== steps[0]?.id && (
          <DialGhostButton
            label={t(ButtonsI18nKey.Back)}
            onClick={onPrevStep}
            iconBefore={<IconArrowNarrowLeft {...BASE_BUTTON_ICON_PROPS} />}
          />
        )}
      </div>
      <div className="flex gap-2">
        <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        {currentStep?.id !== steps.at(-1)?.id && (
          <DialPrimaryButton
            label={t(ButtonsI18nKey.Next)}
            onClick={onNextStep}
            disabled={currentStep?.status !== StepStatus.VALID}
          />
        )}
        {currentStep?.id === steps.at(-1)?.id && (
          <DialPrimaryButton
            label={t(ButtonsI18nKey.Finish)}
            disabled={steps.some((s) => s.status !== StepStatus.VALID)}
            onClick={onFinishClick}
          />
        )}
      </div>
    </div>
  );
};

export default StepperModalButtons;
