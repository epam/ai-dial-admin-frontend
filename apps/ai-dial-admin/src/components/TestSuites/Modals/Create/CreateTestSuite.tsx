/* eslint-disable @typescript-eslint/no-unused-vars */
import { DialPopup, DialSteps, PopupSize, StepStatus } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { useI18n } from '@/src/locales/client';

import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { TEST_SUIT_STEPS, TestSuitTab } from './constants';
import TestSuiteProperties from './Properties';

interface Props {
  isModalOpen: boolean;
  names: string[];
  onClose: () => void;
  onCreate: (suite: TestSuite) => void;
}

const CreateTestSuit: FC<Props> = ({ names, onClose, isModalOpen, onCreate }) => {
  const t = useI18n();

  const [steps, setSteps] = useState(TEST_SUIT_STEPS(t));
  const [currentStepId, setCurrentStep] = useState(steps[0].id);
  const [testSuit, setTestSuit] = useState<TestSuite>({} as TestSuite);

  const currentStep = useMemo(() => steps.find((step) => step.id === currentStepId), [steps, currentStepId]);

  const onFinishClick = useCallback(() => {}, []);

  useEffect(() => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === TestSuitTab.Properties ? { ...step, status: testSuit.name ? StepStatus.VALID : void 0 } : step,
      ),
    );
  }, [testSuit, currentStepId]);

  return (
    <DialPopup
      onClose={onClose}
      header={t(TestSuitesI18nKey.CreateTestSuite)}
      portalId="CreateTestSuiteModal"
      open={isModalOpen}
      size={PopupSize.Lg}
    >
      <div className="flex flex-col py-4 px-6 overflow-auto gap-y-6 h-[450px]">
        <DialSteps steps={steps} currentStep={currentStepId} onChangeStep={setCurrentStep} />
        <div className="flex-1 min-h-0">
          <TestSuiteProperties testSuite={testSuit} names={names} onChangeTestSuite={setTestSuit} />
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
