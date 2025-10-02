'use client';

import { Dispatch, FC, SetStateAction } from 'react';

import { IconArrowNarrowLeft, IconArrowNarrowRight } from '@tabler/icons-react';
import { Step, StepStatus } from '@epam/ai-dial-ui-kit';

import Button from '@/src/components/Common/Button/Button';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  steps: Step[];
  currentStep: string;
  setCurrentStep: Dispatch<SetStateAction<string>>;
  onFinishClick: () => void;
}

const ImportModalButtons: FC<Props> = ({ steps, currentStep, setCurrentStep, onFinishClick }) => {
  const t = useI18n();

  const onNextStep = () => {
    const stepIndex = steps.findIndex((s) => s.id === currentStep);
    setCurrentStep(steps[stepIndex + 1].id);
  };

  const onPrevStep = () => {
    const stepIndex = steps.findIndex((s) => s.id === currentStep);
    setCurrentStep(steps[stepIndex - 1].id);
  };
  return (
    <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
      {currentStep !== steps[0]?.id && (
        <Button
          cssClass="secondary"
          title={t(ButtonsI18nKey.Previous)}
          onClick={onPrevStep}
          iconBefore={<IconArrowNarrowLeft {...BASE_ICON_PROPS} />}
        />
      )}
      {currentStep !== steps.at(-1)?.id && (
        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Next)}
          onClick={onNextStep}
          iconAfter={<IconArrowNarrowRight {...BASE_ICON_PROPS} />}
          disable={currentStep.status !== StepStatus.VALID}
        />
      )}
      {currentStep === steps.at(-1)?.id && (
        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Finish)}
          disable={steps.some((s) => s.status !== StepStatus.VALID)}
          onClick={onFinishClick}
        />
      )}
    </div>
  );
};

export default ImportModalButtons;
