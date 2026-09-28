'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import {
  DialGhostButton,
  DialGhostIconButton,
  DialNeutralButton,
  DialNotification,
  DialPopup,
  DialPrimaryButton,
  DialSteps,
  ElementSize,
  NotificationVariant,
  PopupSize,
  StepStatus,
} from '@epam/ai-dial-ui-kit';
import { IconArrowNarrowLeft, IconArrowNarrowRight, IconChevronLeft, IconRefresh } from '@tabler/icons-react';
import { isEqual } from 'lodash';

import Methods from '@/src/components/TestSuites/Methods/Methods';
import RequestTemplate from '@/src/components/TestSuites/RequestTemplate/RequestTemplate';
import { getDefaultRequestTemplateFor } from '@/src/components/TestSuites/utils/method';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { JsonataVariable } from '@/src/models/jsonata';
import { EDIT_REQUEST_STEPS, EditRequestStep } from './constants';
import TemplateVariablesDoc from '@/src/components/TestSuites/RequestTemplate/components/TemplateVariablesDoc';

export interface EditRequestWizardProps {
  testSuite: TestSuite;
  onChangeTestSuite: (testSuite: TestSuite) => void;
  selectedApplication: Deployment | null;
  isOpen?: boolean;
  /** True when opened from "Add" for a brand new request, rather than "Edit request" on an existing
   *  one — the Configuration step starts without a completed checkmark until the user visits it. */
  isNewRequest?: boolean;
  onClose?: () => void;
  takenColumnNames?: string[];
  jsonataVariables?: JsonataVariable[];
}

const EditRequestWizard: FC<EditRequestWizardProps> = ({
  testSuite,
  onChangeTestSuite,
  selectedApplication,
  isOpen = false,
  isNewRequest = false,
  onClose,
  takenColumnNames,
  jsonataVariables,
}) => {
  const t = useI18n();
  const { isValid } = useSaveValidationContext();
  const [currentSuite, setCurrentSuite] = useState<TestSuite>(() => structuredClone(testSuite));
  const [currentStepId, setCurrentStepId] = useState<string>(EditRequestStep.Methods);
  const [hasVisitedConfiguration, setHasVisitedConfiguration] = useState(false);
  const [showVarReferences, setShowVarReferences] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentSuite(structuredClone(testSuite));
      setCurrentStepId(EditRequestStep.Methods);
      setHasVisitedConfiguration(false);
    }
  }, [isOpen, testSuite]);

  const onChangeStep = useCallback((stepId: string) => {
    setCurrentStepId(stepId);
    if (stepId === EditRequestStep.Configuration) {
      setHasVisitedConfiguration(true);
    }
  }, []);

  const isMethodValid = !!currentSuite.endpointRef?.method && !!currentSuite.endpointRef?.relativeUrlPattern && isValid;
  const isConfigurationComplete = !isNewRequest || hasVisitedConfiguration;

  const steps = useMemo(
    () =>
      EDIT_REQUEST_STEPS(t).map((step) =>
        step.id === EditRequestStep.Methods
          ? { ...step, status: isMethodValid ? StepStatus.VALID : undefined }
          : { ...step, status: isConfigurationComplete ? StepStatus.VALID : undefined },
      ),
    [t, isMethodValid, isConfigurationComplete],
  );

  const defaultRequestTemplate = useMemo(
    () => getDefaultRequestTemplateFor(currentSuite.endpointRef),
    [currentSuite.endpointRef],
  );
  const isBodyEdited = !!defaultRequestTemplate && !isEqual(currentSuite.requestTemplate, defaultRequestTemplate);

  const onResetToDefault = useCallback(() => {
    setCurrentSuite((prev) => ({ ...prev, requestTemplate: defaultRequestTemplate }));
  }, [defaultRequestTemplate]);

  const handleSave = useCallback(() => {
    onChangeTestSuite(currentSuite);
    onClose?.();
  }, [currentSuite, onChangeTestSuite, onClose]);

  const isConfigurationStep = currentStepId === EditRequestStep.Configuration;

  const footer = (
    <div className="flex flex-row items-center justify-between gap-2 px-6 py-4">
      <div>
        {isConfigurationStep && (
          <DialGhostButton
            label={t(ButtonsI18nKey.Back)}
            onClick={() => onChangeStep(EditRequestStep.Methods)}
            iconBefore={<IconArrowNarrowLeft {...BASE_BUTTON_ICON_PROPS} />}
          />
        )}
      </div>

      <div className="flex flex-row items-center gap-4">
        {isConfigurationStep && isBodyEdited && (
          <DialGhostButton
            label={t(ButtonsI18nKey.ResetToDefault)}
            onClick={onResetToDefault}
            iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} />}
          />
        )}

        <div className="flex gap-2">
          <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
          {isConfigurationStep ? (
            <DialPrimaryButton label={t(ButtonsI18nKey.Save)} onClick={handleSave} disabled={!isMethodValid} />
          ) : (
            <DialPrimaryButton
              label={t(ButtonsI18nKey.Next)}
              onClick={() => onChangeStep(EditRequestStep.Configuration)}
              iconAfter={<IconArrowNarrowRight {...BASE_BUTTON_ICON_PROPS} />}
              disabled={!isMethodValid}
            />
          )}
        </div>
      </div>
    </div>
  );

  const PopupHeader = useCallback(() => {
    if (!showVarReferences) return t(TestSuitesI18nKey.EditRequest);
    return (
      <div className="flex gap-4 items-center">
        <DialGhostIconButton
          icon={<IconChevronLeft />}
          size={ElementSize.Small}
          onClick={() => setShowVarReferences(false)}
        />

        <span className="text-primary text-base">{t(TestSuitesI18nKey.TemplateVariablesViewDoc)}</span>
      </div>
    );
  }, [showVarReferences, t]);

  return (
    <DialPopup
      portalId="EditRequestWizard"
      header={<PopupHeader />}
      open={isOpen}
      onClose={onClose}
      size={PopupSize.Lg}
      className="min-h-[800px]"
      footer={showVarReferences ? null : footer}
    >
      <div className="flex flex-col py-4 px-6 gap-y-6 overflow-hidden h-[670px] relative">
        <DialSteps steps={steps} currentStep={currentStepId} onChangeStep={onChangeStep} />

        <div className="grow overflow-hidden">
          {currentStepId === EditRequestStep.Methods && (
            <Methods
              selectedTarget={selectedApplication}
              testSuite={currentSuite}
              onChange={setCurrentSuite}
              takenColumnNames={takenColumnNames}
            >
              <DialNotification
                message={t(TestSuitesI18nKey.MethodChangeWarning)}
                variant={NotificationVariant.Warning}
              />
            </Methods>
          )}

          {isConfigurationStep && (
            <RequestTemplate
              testSuite={currentSuite}
              onChangeTestSuite={setCurrentSuite}
              onShowVariableDocsClick={() => setShowVarReferences(true)}
              jsonataVariables={jsonataVariables}
            />
          )}
        </div>

        {showVarReferences && (
          <div className="absolute size-full left-0 top-0 bg-layer-3">
            <TemplateVariablesDoc />
          </div>
        )}
      </div>
    </DialPopup>
  );
};

export default EditRequestWizard;
