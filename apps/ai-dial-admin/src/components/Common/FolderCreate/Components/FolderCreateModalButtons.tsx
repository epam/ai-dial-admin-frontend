'use client';

import { FC } from 'react';

import { ButtonVariant, DialButton, Step, StepStatus } from '@epam/ai-dial-ui-kit';
import { IconArrowNarrowLeft } from '@tabler/icons-react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  steps: Step[];
  currentStep?: Step;
  setCurrentStep: (id: string) => void;
  onFinishClick: () => void;
  onClose: () => void;
}

const FolderCreateModalButtons: FC<Props> = ({ steps, currentStep, setCurrentStep, onFinishClick, onClose }) => {
  const t = useI18n();

  const onNextStep = () => {
    const stepIndex = steps.findIndex((s) => s.id === currentStep?.id);
    setCurrentStep(steps[stepIndex + 1]?.id as string);
  };

  const onPrevStep = () => {
    const stepIndex = steps.findIndex((s) => s.id === currentStep?.id);
    setCurrentStep(steps[stepIndex - 1]?.id as string);
  };

  return (
    <div className="flex flex-row items-center justify-between gap-2 px-6 py-4">
      <div>
        {currentStep?.id !== steps[0]?.id && (
          <DialButton
            variant={ButtonVariant.Tertiary}
            title={t(ButtonsI18nKey.Back)}
            onClick={onPrevStep}
            iconBefore={<IconArrowNarrowLeft {...BASE_ICON_PROPS} />}
          />
        )}
      </div>
      <div className="flex gap-2">
        <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        {currentStep?.id !== steps.at(-1)?.id && (
          <DialButton
            variant={ButtonVariant.Primary}
            title={t(ButtonsI18nKey.Next)}
            onClick={onNextStep}
            disable={currentStep?.status !== StepStatus.VALID}
          />
        )}
        {currentStep?.id === steps.at(-1)?.id && (
          <DialButton
            variant={ButtonVariant.Primary}
            title={t(ButtonsI18nKey.Finish)}
            disable={steps.some((s) => s.status !== StepStatus.VALID)}
            onClick={onFinishClick}
          />
        )}
      </div>
    </div>
  );
};

export default FolderCreateModalButtons;
