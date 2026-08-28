'use client';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import {
  DialCloseButton,
  DialGhostButton,
  DialLoader,
  DialNeutralButton,
  DialPrimaryButton,
} from '@epam/ai-dial-ui-kit';
import { IconEdit, IconRefresh } from '@tabler/icons-react';
import classNames from 'classnames';

import { tryOutTestCase, tryOutTestSuite } from '@/src/app/[lang]/test-suites/actions';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import {
  getTryoutResponseFromStorage,
  saveTryoutResponseToStorage,
} from '@/src/components/TestSuites/utils/tryout-storage';
import { BasicI18nKey, ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { SuiteType, TestCase, TestCaseSchema, TestSuite, TryOutHistoryEntry } from '@/src/models/evaluation/test-suite';
import { columnsTab, EntityViewTab, responseTab } from '@/src/utils/tabs/utils';
import {
  normalizeResponseBodyForColumns,
  unwrapJsonRequestBody,
} from '@/src/components/TestSuites/utils/column-eval-context';
import { getRequestTurnCounts, getTryOutSectionShape } from '@/src/utils/evaluation/tryout-sections';
import CollapsibleSection from './CollapsibleSection';
import TryOutColumns from './TryOutColumns';
import TryOutRequestPreview from './TryOutRequestPreview';
import TryOutRequestTabs from './TryOutRequestTabs';
import TryOutResponsePreview from './TryOutResponse';

export interface TryOutResponse {
  statusCode: number;
  [key: string]: unknown;
}
interface Props {
  testSuite: TestSuite;
  testCaseId?: string;
  schema?: TestCaseSchema[];
  initialTestCase?: TestCase;
}

const TryOutResponseBody: FC<{
  response: TryOutResponse | null;
  isRequestSend: boolean;
  growOnOpen: boolean;
}> = ({ response, isRequestSend, growOnOpen }) => {
  const t = useI18n();
  const copyText = useMemo(() => (response?.body ? JSON.stringify(response.body, null, 2) : ''), [response]);

  return (
    <CollapsibleSection
      title={t(BasicI18nKey.Response)}
      fullViewContent={copyText}
      headerIcon={<CopyButton value={copyText} valueLabel={t(BasicI18nKey.Response)} />}
      growOnOpen={growOnOpen}
    >
      {isRequestSend ? (
        <DialLoader />
      ) : (
        <div className={growOnOpen ? 'min-h-0 flex-1' : 'h-64'}>
          <JsonEditor
            entity={response?.body as object}
            options={{ stickyScroll: { enabled: false }, wordWrap: 'off' }}
            readonly={true}
          />
        </div>
      )}
    </CollapsibleSection>
  );
};

const TryOut: FC<Props> = ({ testSuite, testCaseId, schema, initialTestCase }) => {
  const t = useI18n();
  const { sidebar, toggleSidebar } = useAppContext();
  const isMcp = testSuite.suiteType === SuiteType.McpTool;
  const tabs = [responseTab(t), columnsTab(t)];
  const [activeTab, setActiveTab] = useState(tabs[0].id as EntityViewTab);
  const [requestBody, setRequestBody] = useState<Record<string, unknown>>({});
  const [response, setResponse] = useState<TryOutResponse | null>(null);
  const [resolvedRequest, setResolvedRequest] = useState<Record<string, unknown>>({});
  const [history, setHistory] = useState<TryOutHistoryEntry[] | undefined>(undefined);
  const [isRequestSend, setIsRequestSend] = useState(false);
  const [grafanaTraceUrl, setGrafanaTraceUrl] = useState<string | undefined>(undefined);
  const [selectedRequestIndex, setSelectedRequestIndex] = useState(0);
  const [isPreviewLoading, setIsPreviewLoading] = useState(() => !response && !!testCaseId);

  const multiTurnLength = initialTestCase?.multiTurnData?.length ?? 0;
  const turnCounts = useMemo(
    () => getRequestTurnCounts(testSuite, schema, multiTurnLength),
    [testSuite, schema, multiTurnLength],
  );
  const shape = useMemo(() => getTryOutSectionShape(turnCounts), [turnCounts]);
  const showRequestTabs = turnCounts.length > 1 && (shape === 'requests' || shape === 'combined');
  const renderRequestTabs =
    showRequestTabs &&
    !isRequestSend &&
    !isPreviewLoading &&
    ((!response && !!testCaseId) || (!!response && !!history?.length));

  const onChangeRequestBody = useCallback((body: Record<string, unknown>) => {
    setRequestBody(body);
  }, []);

  const onClose = useCallback(() => {
    if (sidebar.isMenuClosed) {
      toggleSidebar();
      sidebar.toggleIsMenuClosed?.();
    }
    sidebar.closeSidebar();
  }, [sidebar, toggleSidebar]);

  const onSendRequest = useCallback(async () => {
    setIsRequestSend(true);
    try {
      const res = testCaseId
        ? await tryOutTestCase(testSuite.id || '', testCaseId)
        : await tryOutTestSuite(testSuite.id || '', requestBody);

      const testSuiteId = testSuite.id || '';
      if (res?.success) {
        const tryoutResponse = (res.response?.response as TryOutResponse) || null;
        setResolvedRequest(res.response?.resolvedRequest || {});
        setResponse(tryoutResponse);
        setGrafanaTraceUrl(res.response?.grafanaTraceUrl);
        setHistory(res.response?.history);
        if (!testCaseId) saveTryoutResponseToStorage(testSuiteId, res.response);
      } else {
        const errorResponse = { response: { error: res?.errorMessage || 'Unknown error', statusCode: 500 } };
        setResolvedRequest({ body: requestBody || {} });
        setResponse(errorResponse.response);
        setHistory(undefined);
        if (!testCaseId) saveTryoutResponseToStorage(testSuiteId, errorResponse as any);
      }
    } finally {
      setIsRequestSend(false);
    }
  }, [testSuite, testCaseId, requestBody]);

  useEffect(() => {
    if (!testCaseId) {
      const responseFromStorage = getTryoutResponseFromStorage(testSuite.id || '');
      if (responseFromStorage) {
        setResponse(responseFromStorage.response as TryOutResponse);
        setResolvedRequest(responseFromStorage.resolvedRequest || {});
        setGrafanaTraceUrl(responseFromStorage.grafanaTraceUrl);
        setHistory(responseFromStorage.history);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelectedRequestIndex(0);
  }, [history]);

  const responseBody = <TryOutResponseBody response={response} isRequestSend={isRequestSend} growOnOpen />;
  const columnsResponseBody = (
    <TryOutResponseBody response={response} isRequestSend={isRequestSend} growOnOpen={false} />
  );

  return (
    <div className={classNames('flex flex-col gap-y-6 size-full min-h-0', !response && 'pb-4')}>
      <>
        <div className="flex flex-col gap-y-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-row items-center gap-3">
              <h1>{t(ButtonsI18nKey.TryOut)}</h1>
              {response ? (
                <div className="flex flex-row items-center gap-4">
                  <DialGhostButton
                    disabled={isRequestSend}
                    label={t(ButtonsI18nKey.Restart)}
                    iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} />}
                    onClick={onSendRequest}
                  />
                  {!testCaseId && (
                    <DialNeutralButton
                      iconBefore={<IconEdit {...BASE_BUTTON_ICON_PROPS} />}
                      label={t(ButtonsI18nKey.Change)}
                      onClick={() => {
                        setResponse(null);
                        setActiveTab(EntityViewTab.Response);
                      }}
                    />
                  )}
                </div>
              ) : null}
            </div>

            <DialCloseButton onClose={onClose} />
          </div>
          <p className="text-secondary dial-small-text">{t(TestSuitesI18nKey.TryoutWarning)}</p>
        </div>
        {response ? (
          <div className="flex">
            <Tabs tabs={tabs} activeTab={activeTab} onChangeActiveTab={setActiveTab} />
          </div>
        ) : null}
        {renderRequestTabs ? (
          <TryOutRequestTabs
            testSuite={testSuite}
            selectedIndex={selectedRequestIndex}
            onSelect={setSelectedRequestIndex}
          />
        ) : null}

        {activeTab === EntityViewTab.Response && (
          <>
            <div className="flex-1 flex flex-col gap-y-8 pb-2 min-h-0 overflow-auto">
              {!response && (
                <TryOutRequestPreview
                  testSuite={testSuite}
                  testCaseId={testCaseId}
                  schema={schema}
                  initialTestCase={initialTestCase}
                  resolvedRequest={resolvedRequest}
                  isRequestSend={isRequestSend}
                  requestBody={requestBody}
                  onChangeRequestBody={onChangeRequestBody}
                  selectedRequestIndex={renderRequestTabs ? selectedRequestIndex : undefined}
                  onLoadingChange={setIsPreviewLoading}
                />
              )}

              {response && (
                <TryOutResponsePreview
                  response={response}
                  resolvedRequest={resolvedRequest}
                  history={history}
                  grafanaTraceUrl={grafanaTraceUrl}
                  isRequestSend={isRequestSend}
                  responseBody={responseBody}
                  isMcp={isMcp}
                  testSuite={testSuite}
                  schema={schema}
                  multiTurnData={initialTestCase?.multiTurnData}
                  selectedRequestIndex={renderRequestTabs ? selectedRequestIndex : undefined}
                />
              )}
            </div>
            {!response ? (
              <div className="flex justify-end gap-x-4 pt-4 border-t border-secondary">
                <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
                <DialPrimaryButton
                  label={t(ButtonsI18nKey.SendRequest)}
                  onClick={() => onSendRequest()}
                  disabled={isRequestSend}
                />
              </div>
            ) : null}
          </>
        )}

        {activeTab === EntityViewTab.Columns && (
          <TryOutColumns
            testSuite={testSuite}
            history={history}
            schema={schema}
            multiTurnData={initialTestCase?.multiTurnData}
            columns={testSuite.responseColumns}
            response={normalizeResponseBodyForColumns(response?.body as Record<string, unknown>)}
            request={unwrapJsonRequestBody(resolvedRequest.body as Record<string, unknown> | undefined)}
            isLoading={isRequestSend}
            responseBody={columnsResponseBody}
            selectedRequestIndex={renderRequestTabs ? selectedRequestIndex : undefined}
          />
        )}
      </>
    </div>
  );
};

export default TryOut;
