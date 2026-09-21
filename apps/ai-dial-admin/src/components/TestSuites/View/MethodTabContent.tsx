'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { ButtonAppearance, DialNotification, DialPrimaryButton, NotificationVariant } from '@epam/ai-dial-ui-kit';
import { IconEdit } from '@tabler/icons-react';

import { getDeployment, getDeploymentById } from '@/src/app/[lang]/test-suites/actions';
import EndpointSchema from '@/src/components/TestSuites/EndpointSchema/EndpointSchema';
import EditRequestWizard from '@/src/components/TestSuites/Modals/EditRequestWizard/EditRequestWizard';
import MethodEndpoint from '@/src/components/TestSuites/Methods/Endpoint';
import RequestsSidebar from '@/src/components/TestSuites/RequestChain/RequestsSidebar';
import TryOutButton from '@/src/components/TestSuites/RequestTemplate/components/TryOutButton';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import McpMethodContent from '@/src/components/TestSuites/View/McpMethodContent';
import RequestDynamicConfiguration from '@/src/components/TestSuites/View/RequestDynamicConfiguration';
import { Dataset } from '@/src/models/evaluation/dataset';
import { Deployment } from '@/src/models/evaluation/deployment';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import {
  addRequest,
  fromRequestView,
  getPreviousOutputVariables,
  getRequestCount,
  getRequestLabel,
  getTakenResponseColumnNames,
  removeRequestAt,
  toRequestView,
  updateRequestName,
} from '@/src/utils/evaluation/request-chain';

interface Props {
  testSuite: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
  dataset?: Dataset | null;
}

const MethodTabContent: FC<Props> = ({ testSuite, onChange, isSkipRefresh, dataset }) => {
  const isMcp = testSuite.suiteType === SuiteType.McpTool;

  if (isMcp) {
    return <McpMethodContent testSuite={testSuite} onChange={onChange} isSkipRefresh={isSkipRefresh} />;
  }

  return (
    <DeploymentMethodContent
      testSuite={testSuite}
      onChange={onChange}
      isSkipRefresh={isSkipRefresh}
      dataset={dataset}
    />
  );
};

const DeploymentMethodContent: FC<Props> = ({ testSuite, onChange, isSkipRefresh, dataset }) => {
  const t = useI18n();
  const [selectedApplication, setSelectedApplication] = useState<Deployment | null>(null);
  const [isEditRequestWizardOpen, setIsEditRequestWizardOpen] = useState(false);
  const [isNewRequest, setIsNewRequest] = useState(false);
  const [rawSelectedRequestIndex, setSelectedRequestIndex] = useState(0);
  const { sidebar } = useAppContext();
  const isTryOutOpen = sidebar.show;

  const selectedRequestIndex = Math.min(rawSelectedRequestIndex, Math.max(getRequestCount(testSuite) - 1, 0));
  const deploymentId = testSuite.deploymentRef?.id;
  const deploymentType = testSuite.deploymentRef?.type;

  useEffect(() => {
    if (selectedRequestIndex !== rawSelectedRequestIndex) {
      setSelectedRequestIndex(selectedRequestIndex);
    }
  }, [selectedRequestIndex, rawSelectedRequestIndex]);

  const requestView = toRequestView(testSuite, selectedRequestIndex);

  const onChangeRequestView = useCallback(
    (view: TestSuite, isSkipRefreshChange?: boolean) =>
      onChange(fromRequestView(testSuite, selectedRequestIndex, view), isSkipRefreshChange),
    [onChange, testSuite, selectedRequestIndex],
  );

  useEffect(() => {
    if (!deploymentId) {
      setSelectedApplication(null);
      return;
    }

    let cancelled = false;
    const load = deploymentType ? getDeployment(deploymentId, deploymentType) : getDeploymentById(deploymentId);

    load.then((deployment) => {
      if (!cancelled) {
        setSelectedApplication(deployment);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [deploymentId, deploymentType]);

  const onAddRequest = useCallback(() => {
    const updatedSuite = addRequest(testSuite);
    onChange(updatedSuite);
    setSelectedRequestIndex(getRequestCount(updatedSuite) - 1);
    setIsNewRequest(true);
    setIsEditRequestWizardOpen(true);
  }, [onChange, testSuite]);

  const onRemoveRequest = useCallback(
    (index: number) => {
      onChange(removeRequestAt(testSuite, index));
      setSelectedRequestIndex((currentIndex) => (index <= currentIndex ? Math.max(0, currentIndex - 1) : currentIndex));
    },
    [onChange, testSuite],
  );

  const onOpenEditRequestWizard = useCallback(() => {
    setIsNewRequest(false);
    setIsEditRequestWizardOpen(true);
  }, []);

  const onCloseEditRequestWizard = useCallback(() => {
    setIsEditRequestWizardOpen(false);
    setIsNewRequest(false);
  }, []);

  const onRenameRequest = useCallback(
    (index: number, name: string) => onChange(updateRequestName(testSuite, index, name)),
    [onChange, testSuite],
  );

  const describeRequest = useCallback(
    (requestIndex: number) =>
      t(TestSuitesI18nKey.RequestChainOutputOf, {
        request: getRequestLabel(testSuite, requestIndex, t(TestSuitesI18nKey.Request)),
      }),
    [t, testSuite],
  );

  const previousOutputVariables = useMemo(
    () => getPreviousOutputVariables(testSuite, selectedRequestIndex, describeRequest),
    [testSuite, selectedRequestIndex, describeRequest],
  );

  const takenColumnNames = useMemo(
    () => getTakenResponseColumnNames(testSuite, selectedRequestIndex),
    [testSuite, selectedRequestIndex],
  );

  const previousColumnNames = previousOutputVariables.map((variable) => `$${variable.name}`);
  const previousOutputsMessage = previousColumnNames.length
    ? t(TestSuitesI18nKey.RequestChainPreviousOutputsColumnsInfo, { columns: previousColumnNames.join(', ') })
    : t(TestSuitesI18nKey.RequestChainPreviousOutputsInfo);

  return (
    <div className="flex flex-row gap-6 h-full overflow-hidden">
      <div className="h-full overflow-y-scroll">
        <RequestsSidebar
          testSuite={testSuite}
          selectedIndex={selectedRequestIndex}
          disabled={isTryOutOpen}
          onSelect={setSelectedRequestIndex}
          onAdd={onAddRequest}
          onRemove={onRemoveRequest}
          onRename={onRenameRequest}
        />
      </div>

      <div className="flex flex-col gap-y-8 flex-1 min-w-0 h-full overflow-y-scroll">
        {selectedRequestIndex > 0 && (
          <DialNotification variant={NotificationVariant.Info} message={previousOutputsMessage} />
        )}

        <div className="flex flex-col gap-3">
          <div className="flex flex-col">
            <div className="flex flex-row justify-between">
              <MethodEndpoint testSuite={requestView} showFormattedUrl />

              <div className="flex flex-row gap-3 items-center">
                <DialPrimaryButton
                  iconBefore={<IconEdit {...BASE_BUTTON_ICON_PROPS} />}
                  appearance={ButtonAppearance.Ghost}
                  label={t(TestSuitesI18nKey.EditRequest)}
                  disabled={isTryOutOpen}
                  tooltipProps={
                    isTryOutOpen ? { tooltip: t(TestSuitesI18nKey.EditRequestDisabledWhileTryOutOpen) } : undefined
                  }
                  onClick={onOpenEditRequestWizard}
                />
                {selectedRequestIndex === 0 && <TryOutButton testSuite={testSuite} />}
              </div>
            </div>
          </div>

          <RequestDynamicConfiguration
            key={`dynamic-configuration-${selectedRequestIndex}`}
            testSuiteId={testSuite.id as string}
            datasetId={dataset?.id}
            requestView={requestView}
            onChangeRequestView={onChangeRequestView}
            schema={dataset?.testCaseSchema}
            title={t(TestSuitesI18nKey.DynamicConfiguration)}
          />
          <EndpointSchema
            key={`endpoint-schema-${selectedRequestIndex}`}
            testSuite={requestView}
            onChangeTestSuite={onChangeRequestView}
            isSkipRefresh={isSkipRefresh}
            jsonataVariables={previousOutputVariables}
            takenColumnNames={takenColumnNames}
          />

          {isEditRequestWizardOpen &&
            createPortal(
              <EditRequestWizard
                testSuite={requestView}
                onChangeTestSuite={onChangeRequestView}
                selectedApplication={selectedApplication}
                isOpen={isEditRequestWizardOpen}
                isNewRequest={isNewRequest}
                onClose={onCloseEditRequestWizard}
                takenColumnNames={takenColumnNames}
                jsonataVariables={previousOutputVariables}
              />,
              document.body,
            )}
        </div>
      </div>
    </div>
  );
};

export default MethodTabContent;
