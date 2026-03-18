'use client';
import { FC, useCallback, useEffect, useState } from 'react';

import {
  AlertVariant,
  DialAlert,
  DialCloseButton,
  DialLoader,
  DialNeutralButton,
  DialPrimaryButton,
  ElementSize,
} from '@epam/ai-dial-ui-kit';

import {
  getTestCaseTemplateVariables,
  getTestSuiteTemplateVariables,
  tryOutTestCase,
  tryOutTestSuite,
} from '@/src/app/[lang]/test-suites/actions';
import Grafana from '@/public/images/icons/grafana.svg';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { saveTryoutResponseToStorage } from '@/src/components/TestSuites/utils/tryout-storage';
import { convertVariableIntoInitialRequest } from '@/src/components/TestSuites/utils/template-variables';
import { BasicI18nKey, ButtonsI18nKey, RunsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { TemplateVariable, TestSuite } from '@/src/models/evaluation/test-suite';
import CollapsibleSection from './CollapsibleSection';
import Variables from './Variables';

interface TryOutResponse {
  statusCode: number;
  [key: string]: unknown;
}
interface Props {
  testSuite: TestSuite;
  testCaseId?: string;
}

const TryOut: FC<Props> = ({ testSuite, testCaseId }) => {
  const t = useI18n();
  const { sidebar, toggleSidebar } = useAppContext();

  const [requestBody, setRequestBody] = useState<Record<string, unknown>>({});
  const [response, setResponse] = useState<TryOutResponse | null>(null);
  const [resolvedRequest, setResolvedRequest] = useState<Record<string, unknown>>({});
  const [isRequestSend, setIsRequestSend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [grafanaTraceUrl, setGrafanaTraceUrl] = useState<string | undefined>(undefined);
  const [variables, setVariables] = useState<TemplateVariable[]>([]);

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
        saveTryoutResponseToStorage(testSuiteId, tryoutResponse);
      } else {
        const errorResponse = { error: res?.errorMessage || 'Unknown error', statusCode: 500 } as TryOutResponse;
        setResolvedRequest(requestBody || {});
        setResponse(errorResponse);
        saveTryoutResponseToStorage(testSuiteId, errorResponse);
      }
    } finally {
      setIsRequestSend(false);
    }
  }, [testSuite, testCaseId, requestBody]);

  useEffect(() => {
    const fetchVariables = async () => {
      setIsLoading(true);
      try {
        const res = testCaseId
          ? await getTestCaseTemplateVariables(testSuite.id || '', testCaseId || '')
          : await getTestSuiteTemplateVariables(testSuite.id || '');

        const vars = res || [];
        setVariables(vars);
        setRequestBody(convertVariableIntoInitialRequest(vars));
      } finally {
        setIsLoading(false);
      }
    };

    fetchVariables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-y-6 size-full min-h-0 py-6">
      {isLoading ? (
        <DialLoader size={40} />
      ) : (
        <>
          <div className="flex flex-col gap-y-3 px-6">
            <div className="flex items-center justify-between">
              <h1>{t(ButtonsI18nKey.TryOut)}</h1>
              <div className="flex flex-row items-center gap-x-4">
                <DialCloseButton onClose={onClose} />
              </div>
            </div>
            <p className="text-secondary dial-small-text">{t(TestSuitesI18nKey.TryoutWarning)}</p>
          </div>
          <div className="flex-1 flex flex-col gap-y-8 pb-2 min-h-0 px-6">
            {!response && (
              <>
                <div className="flex flex-col">
                  <p className="dial-small-text mb-2">{t(TestSuitesI18nKey.DynamicConfiguration)}</p>
                  <Variables
                    variables={variables}
                    requestBody={requestBody}
                    onChangeRequestBody={onChangeRequestBody}
                  />
                </div>

                <div className="flex flex-col">
                  <p className="dial-small-text mb-2">{t(TestSuitesI18nKey.RequestBodyPreview)}</p>
                  <p className="text-secondary mb-2 dial-small-text">
                    {testSuite.endpointRef?.method} {testSuite.endpointRef?.relativeUrlPattern}
                  </p>
                  <div className="h-[300px]">
                    <JsonEditor
                      entity={resolvedRequest}
                      options={{ stickyScroll: { enabled: false }, wordWrap: 'bounded' }}
                      readonly={true}
                    />
                  </div>
                </div>
              </>
            )}

            {response && (
              <>
                <DialAlert
                  message={`${response.statusCode}`}
                  variant={
                    response.statusCode >= 200 && response.statusCode < 300 ? AlertVariant.Success : AlertVariant.Error
                  }
                >
                  {grafanaTraceUrl && (
                    <DialNeutralButton
                      size={ElementSize.Small}
                      className="w-fit"
                      iconBefore={<Grafana />}
                      label={t(RunsI18nKey.GrafanaRun)}
                      onClick={() => window.open(grafanaTraceUrl, '_blank')}
                    />
                  )}
                </DialAlert>
                <CollapsibleSection title={t(BasicI18nKey.Request)} growOnOpen>
                  {isRequestSend ? (
                    <DialLoader />
                  ) : (
                    <JsonEditor
                      entity={resolvedRequest}
                      options={{ stickyScroll: { enabled: false }, wordWrap: 'bounded' }}
                      readonly={true}
                    />
                  )}
                </CollapsibleSection>
                <CollapsibleSection title={t(BasicI18nKey.Response)} growOnOpen>
                  {isRequestSend ? (
                    <DialLoader />
                  ) : (
                    <JsonEditor
                      entity={response}
                      options={{ stickyScroll: { enabled: false }, wordWrap: 'off' }}
                      readonly={true}
                    />
                  )}
                </CollapsibleSection>
              </>
            )}
          </div>
          <div className="flex justify-end gap-x-4 px-6 py-4 border-t border-secondary">
            <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
            <DialPrimaryButton
              label={t(ButtonsI18nKey.SendRequest)}
              onClick={() => onSendRequest()}
              disabled={isRequestSend}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default TryOut;
