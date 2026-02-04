/* eslint-disable @typescript-eslint/no-unused-vars */
import { DialPopup, DialSteps, PopupSize, StepStatus } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { useI18n } from '@/src/locales/client';

import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { TEST_SUIT_STEPS, TestSuitTab } from './constants';
import TestSuiteProperties from './Properties';
import Applications from './Applications';
import Methods from '@/src/components/TestSuites/Methods/Methods';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onCreate: (suite: TestSuite) => void;
}

const CreateTestSuit: FC<Props> = ({ onClose, isModalOpen, onCreate }) => {
  const t = useI18n();

  const [steps, setSteps] = useState(TEST_SUIT_STEPS(t));
  const [currentStepId, setCurrentStep] = useState(steps[0].id);
  // TODO: mock data, replace after support deployments API
  const [testSuite, setTestSuite] = useState<TestSuite>({
    name: 'My Test Suite',
    deploymentRef: {
      id: 'deploy-001',
      name: 'Production',
    },
    endpointRef: {
      method: 'POST',
      relativeUrl: '/chat/completions',
    },
  } as TestSuite);
  const [selectedApplication, setSelectedApplication] = useState<string>('');

  const currentStep = useMemo(() => steps.find((step) => step.id === currentStepId), [steps, currentStepId]);

  const onFinishClick = useCallback(() => {
    onCreate(testSuite);
  }, [onCreate, testSuite]);

  useEffect(() => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === TestSuitTab.Properties ? { ...step, status: testSuite.name ? StepStatus.VALID : void 0 } : step,
      ),
    );
  }, [testSuite, currentStepId]);

  useEffect(() => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === TestSuitTab.Application
          ? { ...step, status: selectedApplication ? StepStatus.VALID : void 0 }
          : step,
      ),
    );
  }, [selectedApplication, currentStepId]);

  return (
    <DialPopup
      onClose={onClose}
      header={t(TestSuitesI18nKey.CreateTestSuite)}
      portalId="CreateTestSuiteModal"
      open={isModalOpen}
      size={PopupSize.Lg}
    >
      <div className="flex flex-col py-4 px-6 overflow-auto gap-y-6 h-[600px]">
        <DialSteps steps={steps} currentStep={currentStepId} onChangeStep={setCurrentStep} />
        <div className="flex-1 min-h-0">
          {currentStepId === TestSuitTab.Properties && (
            <TestSuiteProperties testSuite={testSuite} onChangeTestSuite={setTestSuite} />
          )}

          {currentStepId === TestSuitTab.Application && (
            <Applications selectedApplication={selectedApplication} onChange={setSelectedApplication} />
          )}

          {currentStepId === TestSuitTab.Methods && <Methods methods={['/api', 'aaaa', 'sss']} />}
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
