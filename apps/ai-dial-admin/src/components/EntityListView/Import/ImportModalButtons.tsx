'use client';

import { FC } from 'react';

import { ButtonVariant, DialButton, Step, StepStatus } from '@epam/ai-dial-ui-kit';
import { IconArrowNarrowLeft, IconArrowNarrowRight } from '@tabler/icons-react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  steps: Step[];
  currentStep?: Step;
  onChangeStep: (id: string) => void;
  onFinishClick: () => void;
}

const ImportModalButtons: FC<Props> = ({ steps, currentStep, onChangeStep, onFinishClick }) => {
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
    <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
      {currentStep?.id !== steps[0]?.id && (
        <DialButton
          variant={ButtonVariant.Secondary}
          label={t(ButtonsI18nKey.Previous)}
          onClick={onPrevStep}
          iconBefore={<IconArrowNarrowLeft {...BASE_ICON_PROPS} />}
        />
      )}
      {currentStep?.id !== steps.at(-1)?.id && (
        <DialButton
          variant={ButtonVariant.Primary}
          label={t(ButtonsI18nKey.Next)}
          onClick={onNextStep}
          iconAfter={<IconArrowNarrowRight {...BASE_ICON_PROPS} />}
          disabled={currentStep?.status !== StepStatus.VALID}
        />
      )}
      {currentStep?.id === steps.at(-1)?.id && (
        <DialButton
          variant={ButtonVariant.Primary}
          label={t(ButtonsI18nKey.Finish)}
          disabled={steps.some((s) => s.status !== StepStatus.VALID)}
          onClick={onFinishClick}
        />
      )}
    </div>
  );
};

export default ImportModalButtons;
