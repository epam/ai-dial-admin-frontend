'use client';
import { FC, useCallback, useEffect, useState } from 'react';

import { DialCloseButton, DialLoader, DialPrimaryButton } from '@epam/ai-dial-ui-kit';

import {
  getTestCaseTemplateVariables,
  getTestSuiteTemplateVariables,
  tryOutTestCase,
  tryOutTestSuite,
} from '@/src/app/[lang]/test-suites/actions';
import Divider from '@/src/components/Common/Divider/Divider';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { convertVariableIntoInitialRequest } from '@/src/components/TestSuites/utils/template-variables';
import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { TemplateVariable } from '@/src/models/evaluation/test-suite';
import CollapsibleSection from './CollapsibleSection';
import Variables from './Variables';

interface Props {
  testSuiteId: string;
  testCaseId?: string;
}

const TryOut: FC<Props> = ({ testSuiteId, testCaseId }) => {
  const t = useI18n();
  const { sidebar, toggleSidebar } = useAppContext();

  const [requestBody, setRequestBody] = useState<Record<string, unknown>>({});
  const [response, setResponse] = useState<Record<string, unknown>>({});
  const [resolvedRequest, setResolvedRequest] = useState<Record<string, unknown>>({});
  const [isRequestSend, setIsRequestSend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [variables, setVariables] = useState<TemplateVariable[]>([]);

  const onChangeRequestBody = useCallback((body: Record<string, unknown>) => {
    setRequestBody(body);
  }, []);

  const close = useCallback(() => {
    if (sidebar.isMenuClosed) {
      toggleSidebar();
      sidebar.toggleIsMenuClosed?.();
    }
    sidebar.closeSidebar();
  }, [sidebar, toggleSidebar]);

  const sendRequest = useCallback(async () => {
    setIsRequestSend(true);
    try {
      const res = testCaseId
        ? await tryOutTestCase(testSuiteId, testCaseId)
        : await tryOutTestSuite(testSuiteId, requestBody);

      if (res?.success) {
        setResolvedRequest(res.response?.resolvedRequest || {});
        setResponse(res.response?.response || {});
      } else {
        setResolvedRequest(requestBody || {});
        setResponse({ error: res?.errorMessage || 'Unknown error' });
      }
    } finally {
      setIsRequestSend(false);
    }
  }, [testSuiteId, testCaseId, requestBody]);

  useEffect(() => {
    const fetchVariables = async () => {
      setIsLoading(true);
      try {
        const res = testCaseId
          ? await getTestCaseTemplateVariables(testSuiteId, testCaseId)
          : await getTestSuiteTemplateVariables(testSuiteId);

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
    <div className="flex flex-col gap-y-8 size-full min-h-0">
      {isLoading ? (
        <DialLoader size={40} />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h1>{t(ButtonsI18nKey.TryOut)}</h1>
            <div className="flex flex-row items-center gap-x-4">
              <DialPrimaryButton
                label={t(ButtonsI18nKey.SendRequest)}
                onClick={() => sendRequest()}
                disabled={isRequestSend}
              />
              <DialCloseButton onClose={close} />
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-y-8 pb-2 min-h-0">
            <CollapsibleSection title={t(BasicI18nKey.Variables)}>
              {variables.length === 0 ? (
                <div>{t(BasicI18nKey.NoVariables)}</div>
              ) : (
                <Variables variables={variables} requestBody={requestBody} onChangeRequestBody={onChangeRequestBody} />
              )}
            </CollapsibleSection>
            <Divider />
            <CollapsibleSection title={t(BasicI18nKey.Request)} growOnOpen>
              {isRequestSend ? (
                <DialLoader />
              ) : (
                <JsonEditor entity={resolvedRequest} options={{ stickyScroll: { enabled: false } }} readonly={true} />
              )}
            </CollapsibleSection>
            <CollapsibleSection title={t(BasicI18nKey.Response)} growOnOpen>
              {isRequestSend ? (
                <DialLoader />
              ) : (
                <JsonEditor entity={response} options={{ stickyScroll: { enabled: false } }} readonly={true} />
              )}
            </CollapsibleSection>
          </div>
        </>
      )}
    </div>
  );
};

export default TryOut;
