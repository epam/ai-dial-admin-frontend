import { DialPopup, DialSteps, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useMemo, useState } from 'react';

import { useI18n } from '@/src/locales/client';

import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import { TestSuitsI18nKey } from '@/src/constants/i18n';
import { TestSuits } from '@/src/models/evaluation/test-suit';
import { TEST_SUIT_STEPS } from './constants';
import TestSuitProperties from './Properties';

interface Props {
  isModalOpen: boolean;
  names: string[];
  onClose: () => void;
  onCreate: (suit: TestSuits) => void;
}

const CreateTestSuit: FC<Props> = ({ names, onClose, isModalOpen, onCreate }) => {
  const t = useI18n();

  const [steps, setSteps] = useState(TEST_SUIT_STEPS(t));
  const [currentStepId, setCurrentStep] = useState(steps[0].id);
  const [testSuit, setTestSuit] = useState<TestSuits>({} as TestSuits);

  const currentStep = useMemo(() => steps.find((step) => step.id === currentStepId), [steps, currentStepId]);

  const onFinishClick = useCallback(() => {}, []);

  return (
    <DialPopup
      onClose={onClose}
      header={t(TestSuitsI18nKey.CreateTestSuit)}
      portalId="CreateTestSuitModal"
      open={isModalOpen}
      size={PopupSize.Lg}
    >
      <div className="flex flex-col py-4 px-6 overflow-auto gap-y-6 h-[450px]">
        <DialSteps steps={steps} currentStep={currentStepId} onChangeStep={setCurrentStep} />
        <div className="flex-1 min-h-0">
          <TestSuitProperties testSuit={testSuit} names={names} onChangeTestSuit={setTestSuit} />
        </div>
      </div>
      <StepperModalButtons
        onClose={onClose}
        onFinishClick={onFinishClick}
        onChangeStep={setCurrentStep}
        steps={steps}
        currentStep={currentStep}
      />
    </DialPopup>
  );
};

export default CreateTestSuit;
