'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  ButtonAppearance,
  DialInput,
  DialNotification,
  DialPrimaryButton,
  NotificationVariant,
} from '@epam/ai-dial-ui-kit';
import { IconEdit } from '@tabler/icons-react';

import { getDeployments } from '@/src/app/[lang]/test-suites/actions';
import EndpointSchema from '@/src/components/TestSuites/EndpointSchema/EndpointSchema';
import ChangeMethodModal from '@/src/components/TestSuites/Modals/ChangeMethodModal/ChangeMethodModal';
import MethodEndpoint from '@/src/components/TestSuites/Methods/Endpoint';
import RequestChainSelector from '@/src/components/TestSuites/RequestChain/RequestChainSelector';
import RequestTemplate from '@/src/components/TestSuites/RequestTemplate/RequestTemplate';
import TryOutButton from '@/src/components/TestSuites/RequestTemplate/components/TryOutButton';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import McpMethodContent from '@/src/components/TestSuites/View/McpMethodContent';
import { Deployment } from '@/src/models/evaluation/deployment';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import {
  addRequest,
  fromRequestView,
  getPreviousOutputVariables,
  getRequestCount,
  getRequestLabel,
  getRequestName,
  removeRequestAt,
  toRequestView,
  updateRequestName,
} from '@/src/utils/evaluation/request-chain';

interface Props {
  testSuite: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
}

const MethodTabContent: FC<Props> = ({ testSuite, onChange, isSkipRefresh }) => {
  const isMcp = testSuite.suiteType === SuiteType.McpTool;

  if (isMcp) {
    return <McpMethodContent testSuite={testSuite} onChange={onChange} isSkipRefresh={isSkipRefresh} />;
  }

  return <DeploymentMethodContent testSuite={testSuite} onChange={onChange} isSkipRefresh={isSkipRefresh} />;
};

const DeploymentMethodContent: FC<Props> = ({ testSuite, onChange, isSkipRefresh }) => {
  const t = useI18n();
  const [deployments, setDeployments] = useState<Deployment[] | null>(null);
  const [isChangeMethodModalOpen, setIsChangeMethodModalOpen] = useState(false);
  const [rawSelectedRequestIndex, setSelectedRequestIndex] = useState(0);
  const { sidebar } = useAppContext();
  const isTryOutOpen = sidebar.show;

  // Clamp to the current chain length so an external reset (e.g. discard changes shrinking
  // `additionalRequests`) can't leave the selection pointing at a request that no longer exists.
  const selectedRequestIndex = Math.min(rawSelectedRequestIndex, Math.max(getRequestCount(testSuite) - 1, 0));

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

  const selectedApplication = deployments?.find((d) => d.deploymentId === testSuite.deploymentRef?.id) ?? null;

  useEffect(() => {
    getDeployments().then((res) => {
      if (res?.success) {
        setDeployments(res.response || []);
      }
    });
  }, []);

  const onAddRequest = useCallback(() => {
    const updatedSuite = addRequest(testSuite);
    onChange(updatedSuite);
    setSelectedRequestIndex(getRequestCount(updatedSuite) - 1);
  }, [onChange, testSuite]);

  const onRemoveRequest = useCallback(
    (index: number) => {
      onChange(removeRequestAt(testSuite, index));
      setSelectedRequestIndex((currentIndex) => (index <= currentIndex ? Math.max(0, currentIndex - 1) : currentIndex));
    },
    [onChange, testSuite],
  );

  const onChangeRequestName = useCallback(
    (name?: string) => onChange(updateRequestName(testSuite, selectedRequestIndex, name ?? '')),
    [onChange, testSuite, selectedRequestIndex],
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

  const previousColumnNames = previousOutputVariables.map((variable) => `$${variable.name}`);
  const previousOutputsMessage = previousColumnNames.length
    ? t(TestSuitesI18nKey.RequestChainPreviousOutputsColumnsInfo, { columns: previousColumnNames.join(', ') })
    : t(TestSuitesI18nKey.RequestChainPreviousOutputsInfo);

  return (
    <div className="flex flex-col gap-y-8">
      <RequestChainSelector
        testSuite={testSuite}
        selectedIndex={selectedRequestIndex}
        disabled={isTryOutOpen}
        onSelect={setSelectedRequestIndex}
        onAdd={onAddRequest}
        onRemove={onRemoveRequest}
      />

      <DialInput
        id="request-name"
        labelProps={{ label: t(TestSuitesI18nKey.RequestName) }}
        containerClassName="max-w-[280px]"
        disabled={isTryOutOpen}
        value={getRequestName(testSuite, selectedRequestIndex) ?? ''}
        onChange={onChangeRequestName}
      />

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
                label={t(TestSuitesI18nKey.ChangeMethod)}
                disabled={isTryOutOpen}
                tooltipProps={
                  isTryOutOpen ? { tooltip: t(TestSuitesI18nKey.ChangeMethodDisabledWhileTryOutOpen) } : undefined
                }
                onClick={() => setIsChangeMethodModalOpen(true)}
              />
              {selectedRequestIndex === 0 && <TryOutButton testSuite={testSuite} />}
            </div>
          </div>
        </div>

        <RequestTemplate
          key={`request-template-${selectedRequestIndex}`}
          testSuite={requestView}
          onChangeTestSuite={onChangeRequestView}
          jsonataVariables={previousOutputVariables}
        />
        <EndpointSchema
          key={`endpoint-schema-${selectedRequestIndex}`}
          testSuite={requestView}
          onChangeTestSuite={onChangeRequestView}
          isSkipRefresh={isSkipRefresh}
          jsonataVariables={previousOutputVariables}
        />

        {isChangeMethodModalOpen &&
          createPortal(
            <ChangeMethodModal
              testSuite={requestView}
              onChangeTestSuite={onChangeRequestView}
              selectedApplication={selectedApplication}
              isOpen={isChangeMethodModalOpen}
              onClose={() => setIsChangeMethodModalOpen(false)}
            />,
            document.body,
          )}
      </div>
    </div>
  );
};

export default MethodTabContent;
