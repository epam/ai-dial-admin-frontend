'use client';

import { FC } from 'react';

import { DialGhostButton, DialNeutralButton, DialPrimaryButton, Step, StepStatus } from '@epam/ai-dial-ui-kit';
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
}

const StepperModalButtons: FC<Props> = ({
  steps,
  currentStep,
  finishButtonLabel,
  onChangeStep,
  onFinishClick,
  onClose,
}) => {
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
    <div
      className={classNames(
        'flex flex-row items-center gap-2 px-6 py-4',
        currentStep?.id !== steps[0]?.id ? 'justify-between' : 'justify-end',
      )}
    >
      {currentStep?.id !== steps[0]?.id && (
        <DialGhostButton
          label={t(ButtonsI18nKey.Back)}
          onClick={onPrevStep}
          iconBefore={<IconArrowNarrowLeft {...BASE_BUTTON_ICON_PROPS} />}
        />
      )}

      <div className="flex gap-2">
        <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        {currentStep?.id !== steps.at(-1)?.id && (
          <DialPrimaryButton
            label={t(ButtonsI18nKey.Next)}
            onClick={onNextStep}
            iconAfter={<IconArrowNarrowRight {...BASE_BUTTON_ICON_PROPS} />}
            disabled={currentStep?.status !== StepStatus.VALID}
          />
        )}
        {currentStep?.id === steps.at(-1)?.id && (
          <DialPrimaryButton
            label={finishButtonLabel || t(ButtonsI18nKey.Finish)}
            disabled={steps.some((s) => s.status !== StepStatus.VALID)}
            onClick={onFinishClick}
          />
        )}
      </div>
    </div>
  );
};

export default StepperModalButtons;
