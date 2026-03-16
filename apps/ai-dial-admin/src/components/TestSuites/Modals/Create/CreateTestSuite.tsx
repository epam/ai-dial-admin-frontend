import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialPopup, DialSteps, PopupSize, StepStatus } from '@epam/ai-dial-ui-kit';

import { getDeployments } from '@/src/app/[lang]/test-suites/actions';
import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import ChangeMethodModal from '@/src/components/TestSuites/Modals/ChangeMethodModal/ChangeMethodModal';
import TestSuiteProperties from '@/src/components/TestSuites/Properties/Properties';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { getErrorNotification } from '@/src/utils/notification';
import Applications from './Applications';
import { TEST_SUIT_STEPS, TestSuitTab } from './constants';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onCreate: (suite: TestSuite) => void;
  currentEntity?: TestSuite;
}

const CreateTestSuit: FC<Props> = ({ onClose, isModalOpen, onCreate, currentEntity }) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const { isValid } = useSaveValidationContext();
  const [steps, setSteps] = useState(TEST_SUIT_STEPS(t, !!currentEntity));
  const [currentStepId, setCurrentStep] = useState(steps[0].id);
  const [testSuite, setTestSuite] = useState<TestSuite>(structuredClone(currentEntity) || ({} as TestSuite));
  const [selectedApplication, setSelectedApplication] = useState<Deployment | null>(null);
  const [deployments, setDeployments] = useState<Deployment[] | null>(null);

  const currentStep = useMemo(() => steps.find((step) => step.id === currentStepId), [steps, currentStepId]);

  const onFinishClick = useCallback(() => {
    onCreate(testSuite);
  }, [onCreate, testSuite]);

  useEffect(() => {
    if (!deployments) {
      getDeployments().then((res) => {
        if (res?.success) {
          setDeployments(res.response || []);
          if (currentEntity?.deploymentRef?.id) {
            const app = res.response?.find((d) => d.deploymentId === currentEntity.deploymentRef?.id);
            setSelectedApplication(app || null);
          }
        } else {
          showNotification(getErrorNotification(res?.errorHeader, res?.errorMessage, res?.requestId));
        }
      });
    }
  }, [currentEntity?.deploymentRef?.id, deployments, showNotification]);

  useEffect(() => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id === TestSuitTab.Target) {
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
      header={t(currentEntity ? TestSuitesI18nKey.UpdateTestSuite : TestSuitesI18nKey.CreateTestSuite)}
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

          {currentStepId === TestSuitTab.Target && (
            <Applications
              deployments={deployments}
              selectedApplicationId={selectedApplication?.deploymentId}
              onChangeApplication={setSelectedApplication}
              onChange={setTestSuite}
            />
          )}

          {currentStepId === TestSuitTab.Methods && (
            <ChangeMethodModal
              isModal={false}
              testSuite={testSuite}
              onChangeTestSuite={setTestSuite}
              selectedApplication={selectedApplication}
            />
          )}
        </div>
      </div>

      <StepperModalButtons
        onClose={onClose}
        onFinishClick={onFinishClick}
        onChangeStep={setCurrentStep}
        steps={steps}
        currentStep={currentStep}
        finishButtonLabel={t(currentEntity ? ButtonsI18nKey.Update : ButtonsI18nKey.Create)}
      />
    </DialPopup>
  );
};

export default CreateTestSuit;
