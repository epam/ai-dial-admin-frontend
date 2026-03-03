'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { DialCollapsibleSidebar } from '@epam/ai-dial-ui-kit';

import { getDeployment } from '@/src/app/[lang]/test-suites/actions';
import { CHAT_COMPLETION_BODY } from '@/src/components/TestSuites/constants/chat-completion-body';
import { CHAT_COMPLETION_METHOD } from '@/src/components/TestSuites/constants/chat-completion-method';
import { CHAT_COMPLETION_RELATIVE_URL } from '@/src/components/TestSuites/constants/methods';
import { generateMethodPathCombinations } from '@/src/components/TestSuites/utils/method';
import { MenuI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TestSuite, TestSuiteEndpointRef } from '@/src/models/evaluation/test-suite';
import MethodInfo from './MethodInfo';
import MethodItem from './MethodItem';
import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';

interface Props {
  testSuite: TestSuite;
  onChange: Dispatch<SetStateAction<TestSuite>>;
  selectedApplication?: Deployment | null;
  isCreate?: boolean;
}

const Methods: FC<Props> = ({ testSuite, selectedApplication, onChange, isCreate }) => {
  const t = useI18n();

  const [activeMethodIndex, setActiveMethodIndex] = useState<number | null>();
  const [fullApplication, setFullApplication] = useState<Deployment | null>();
  const [methods, setMethods] = useState<TestSuiteEndpointRef[]>([]);

  const methodInfo = useMemo(() => {
    if (activeMethodIndex != null) {
      return isCreate ? (activeMethodIndex === 0 ? CHAT_COMPLETION_METHOD : methods[activeMethodIndex]) : {};
    }
    return {};
  }, [activeMethodIndex, isCreate, methods]);

  const onMethodClick = useCallback(
    (index: number) => {
      setActiveMethodIndex(index);
      if (index === 0) {
        onChange((prev: TestSuite) => ({
          ...prev,
          endpointRef: CHAT_COMPLETION_METHOD,
          requestTemplate: {
            body: {
              contentType: APPLICATION_JSON_TYPE,
              content: {
                urlTemplate: CHAT_COMPLETION_RELATIVE_URL,
                body: CHAT_COMPLETION_BODY,
              },
            },
          },
        }));
      } else {
        onChange((prev: TestSuite) => ({
          ...prev,
          endpointRef: {
            method: methods[index - 1].method,
            relativeUrlPattern: methods[index - 1].relativeUrlPattern,
          },
          requestTemplate: {
            body: {
              contentType: APPLICATION_JSON_TYPE,
              content: {
                urlTemplate: methods[index - 1].relativeUrlPattern,
              },
            },
          },
        }));
      }
    },
    [methods, onChange],
  );

  useEffect(() => {
    if (!fullApplication && selectedApplication) {
      const { deploymentId, $type } = selectedApplication;
      getDeployment(deploymentId, $type).then((data) => {
        setFullApplication(data);
        const methods = generateMethodPathCombinations(data?.routes);
        setMethods(methods);
        const index = methods.findIndex(
          (m) =>
            m.method === testSuite.endpointRef?.method &&
            m.relativeUrlPattern === testSuite.endpointRef?.relativeUrlPattern,
        );
        onMethodClick(index === -1 ? 0 : index);
      });
    }
  }, [
    fullApplication,
    onMethodClick,
    selectedApplication,
    testSuite.endpointRef?.method,
    testSuite.endpointRef?.relativeUrlPattern,
  ]);

  return (
    <div className="flex flex-row size-full gap-2">
      <DialCollapsibleSidebar containerClassName="border border-primary" title={t(MenuI18nKey.Applications)}>
        <div className="flex flex-col gap-y-4 ">
          <div className="flex flex-col gap-y-1">
            <span className="dial-tiny text-secondary block">{t(TestSuitesI18nKey.ChatInterface)}</span>
            <MethodItem
              key="chat-completion"
              item={CHAT_COMPLETION_METHOD}
              index={0}
              isActive={activeMethodIndex === 0}
              onClick={onMethodClick}
            />
          </div>
          <div className="flex flex-col gap-y-1">
            {!!methods.length && <span className="dial-tiny text-secondary block">{t(TestSuitesI18nKey.Other)}</span>}
            {methods.map((method, index) => (
              <MethodItem
                key={(method?.relativeUrlPattern || '') + method.method}
                item={method}
                index={index + 1}
                isActive={activeMethodIndex === index + 1}
                onClick={onMethodClick}
              />
            ))}
          </div>
        </div>
      </DialCollapsibleSidebar>

      <div className="flex-1 min-w-0 border border-primary rounded">
        {
          <MethodInfo
            testSuite={{
              ...testSuite,
              endpointRef:
                activeMethodIndex != null
                  ? {
                      ...testSuite.endpointRef,
                      ...methodInfo,
                    }
                  : {},
            }}
            onChangeTestSuite={onChange}
          />
        }
      </div>
    </div>
  );
};

export default Methods;
