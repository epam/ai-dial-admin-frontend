import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialPopup, DialSteps, PopupSize, StepStatus } from '@epam/ai-dial-ui-kit';

import { useI18n } from '@/src/locales/client';
import { getDeployments } from '@/src/app/[lang]/test-suites/actions';
import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import Methods from '@/src/components/TestSuites/Methods/Methods';
import TestSuiteProperties from '@/src/components/TestSuites/Properties/Properties';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import Applications from './Applications';
import { TEST_SUIT_STEPS, TestSuitTab } from './constants';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onCreate: (suite: TestSuite) => void;
}

const CreateTestSuit: FC<Props> = ({ onClose, isModalOpen, onCreate }) => {
  const t = useI18n();
  const { isValid } = useSaveValidationContext();
  const [steps, setSteps] = useState(TEST_SUIT_STEPS(t));
  const [currentStepId, setCurrentStep] = useState(steps[0].id);
  const [testSuite, setTestSuite] = useState<TestSuite>({} as TestSuite);
  const [selectedApplication, setSelectedApplication] = useState<Deployment | null>(null);
  const [deployments, setDeployments] = useState<Deployment[] | null>(null);

  const currentStep = useMemo(() => steps.find((step) => step.id === currentStepId), [steps, currentStepId]);

  const onFinishClick = useCallback(() => {
    onCreate(testSuite);
  }, [onCreate, testSuite]);

  useEffect(() => {
    if (!deployments) {
      getDeployments().then((data) => setDeployments(data));
    }
  }, [deployments]);

  useEffect(() => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id === TestSuitTab.Application) {
          return { ...step, status: selectedApplication ? StepStatus.VALID : void 0 };
        }
        if (step.id === TestSuitTab.Methods) {
          return { ...step, status: testSuite.endpointRef?.method ? StepStatus.VALID : void 0 };
        }
        return step.id === TestSuitTab.Properties ? { ...step, status: isValid ? StepStatus.VALID : void 0 } : step;
      }),
    );
  }, [selectedApplication, currentStepId, testSuite.endpointRef?.method, testSuite.name, isValid]);

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
            <TestSuiteProperties testSuite={testSuite} onChange={setTestSuite} isModal={true} />
          )}

          {currentStepId === TestSuitTab.Application && (
            <Applications
              deployments={deployments}
              selectedApplicationId={selectedApplication?.deploymentId}
              onChangeApplication={setSelectedApplication}
              onChange={setTestSuite}
            />
          )}

          {currentStepId === TestSuitTab.Methods && (
            <Methods selectedApplication={selectedApplication} testSuite={testSuite} onChange={setTestSuite} />
          )}
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
