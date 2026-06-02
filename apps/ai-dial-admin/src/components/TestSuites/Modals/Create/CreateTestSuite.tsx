import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import {
  NotificationVariant,
  DialNotification,
  DialPopup,
  DialSteps,
  PopupSize,
  StepStatus,
} from '@epam/ai-dial-ui-kit';

import { getTestSuiteByName } from '@/src/app/[lang]/test-suites/actions';
import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import Methods from '@/src/components/TestSuites/Methods/Methods';
import McpTool from '@/src/components/TestSuites/Modals/Create/McpTool';
import TestSuiteProperties from '@/src/components/TestSuites/Properties/Properties';
import { ButtonsI18nKey, ErrorI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { Deployment, ToolDefinition } from '@/src/models/evaluation/deployment';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import Target from './Target';
import { TEST_SUIT_STEPS, TestSuitTab } from './constants';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onCreate: (suite: TestSuite) => void;
  currentEntity?: TestSuite;
}

const CreateTestSuit: FC<Props> = ({ onClose, isModalOpen, onCreate, currentEntity }) => {
  const t = useI18n();

  const { isValid } = useSaveValidationContext();
  const [testSuite, setTestSuite] = useState<TestSuite>(structuredClone(currentEntity) || ({} as TestSuite));
  const [steps, setSteps] = useState(TEST_SUIT_STEPS(t, !!currentEntity, testSuite.suiteType));
  const [currentStepId, setCurrentStep] = useState(steps[0].id);
  const [selectedTarget, setSelectedTarget] = useState<Deployment | null>(null);
  const [nameExistsError, setNameExistsError] = useState<string>();
  const [isCheckingName, setIsCheckingName] = useState(false);

  const isMcp = testSuite.suiteType === SuiteType.McpTool;

  const currentStep = useMemo(() => steps.find((step) => step.id === currentStepId), [steps, currentStepId]);

  const onToolSelect = useCallback((tool: ToolDefinition) => {
    setTestSuite((prev) => ({
      ...prev,
      toolRef: {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
      },
    }));
  }, []);

  const onFinishClick = useCallback(() => {
    onCreate(testSuite);
  }, [onCreate, testSuite]);

  const onTestSuiteChange = useCallback(
    (updated: TestSuite) => {
      if (updated.name !== testSuite.name) {
        setNameExistsError(undefined);
      }
      setTestSuite(updated);
    },
    [testSuite.name],
  );

  const onNextStepWithNameCheck = useCallback(async () => {
    if (currentStepId !== TestSuitTab.Properties) {
      const stepIndex = steps.findIndex((s) => s.id === currentStepId);
      setCurrentStep(steps[stepIndex + 1]?.id as string);
      return;
    }

    setIsCheckingName(true);
    const res = await getTestSuiteByName(testSuite.name!);
    setIsCheckingName(false);

    if (res && res.content?.length > 0) {
      setNameExistsError(t(ErrorI18nKey.DisplayNameExists));
    } else {
      const stepIndex = steps.findIndex((s) => s.id === currentStepId);
      setCurrentStep(steps[stepIndex + 1]?.id as string);
    }
  }, [currentStepId, steps, testSuite.name, t]);

  useEffect(() => {
    const baseSteps = TEST_SUIT_STEPS(t, !!currentEntity, testSuite.suiteType);
    setSteps(
      baseSteps.map((step) => {
        if (step.id === TestSuitTab.Target) {
          return { ...step, status: selectedTarget || !!currentEntity ? StepStatus.VALID : void 0 };
        }
        if (step.id === TestSuitTab.Methods) {
          const methodValid = isMcp ? !!testSuite.toolRef : !!testSuite.endpointRef?.method;
          return { ...step, status: methodValid ? StepStatus.VALID : void 0 };
        }
        return step.id === TestSuitTab.Properties ? { ...step, status: isValid ? StepStatus.VALID : void 0 } : step;
      }),
    );
  }, [
    selectedTarget,
    currentStepId,
    testSuite.endpointRef?.method,
    testSuite.toolRef,
    testSuite.suiteType,
    testSuite.name,
    isValid,
    t,
    currentEntity,
    isMcp,
  ]);

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
            <TestSuiteProperties
              testSuite={testSuite}
              onChange={onTestSuiteChange}
              isModal={true}
              nameExistsError={nameExistsError}
            />
          )}

          {currentStepId === TestSuitTab.Target && (
            <Target
              selectedTargetId={
                selectedTarget?.deploymentId ?? currentEntity?.deploymentRef?.id ?? currentEntity?.mcpDeploymentRef?.id
              }
              suiteType={testSuite.suiteType}
              onChangeTarget={setSelectedTarget}
              onChange={setTestSuite}
            />
          )}

          {currentStepId === TestSuitTab.Methods &&
            (isMcp && testSuite.mcpDeploymentRef ? (
              <McpTool
                deploymentId={testSuite.mcpDeploymentRef.id}
                initialToolName={testSuite.toolRef?.name}
                onSelect={onToolSelect}
              />
            ) : (
              <Methods
                selectedTarget={selectedTarget}
                testSuite={testSuite}
                onChange={setTestSuite}
                isCreate={!currentEntity}
              >
                {!!currentEntity && (
                  <DialNotification
                    message={t(TestSuitesI18nKey.MethodChangeWarning)}
                    variant={NotificationVariant.Warning}
                  />
                )}
              </Methods>
            ))}
        </div>
      </div>

      <StepperModalButtons
        onClose={onClose}
        onFinishClick={onFinishClick}
        onChangeStep={setCurrentStep}
        steps={steps}
        currentStep={currentStep}
        finishButtonLabel={t(currentEntity ? ButtonsI18nKey.Update : ButtonsI18nKey.Create)}
        onNextStep={!currentEntity ? () => onNextStepWithNameCheck() : undefined}
        isLoading={isCheckingName}
      />
    </DialPopup>
  );
};

export default CreateTestSuit;
