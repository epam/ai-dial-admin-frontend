'use client';

import { Dispatch, FC, SetStateAction } from 'react';

import { IconArrowNarrowLeft } from '@tabler/icons-react';
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
  onClose: () => void;
}

const FolderCreateModalButtons: FC<Props> = ({ steps, currentStep, setCurrentStep, onFinishClick, onClose }) => {
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
    <div className="flex flex-row items-center justify-between gap-2 px-6 py-4">
      <div>
        {currentStep !== steps[0]?.id && (
          <Button
            cssClass="tertiary"
            title={t(ButtonsI18nKey.Back)}
            onClick={onPrevStep}
            iconBefore={<IconArrowNarrowLeft {...BASE_ICON_PROPS} />}
          />
        )}
      </div>
      <div className="flex gap-2">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        {currentStep !== steps.at(-1)?.id && (
          <Button
            cssClass="primary"
            title={t(ButtonsI18nKey.Next)}
            onClick={onNextStep}
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
    </div>
  );
};

export default FolderCreateModalButtons;
