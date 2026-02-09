'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { DialCollapsibleSidebar } from '@epam/ai-dial-ui-kit';

import { getDeployment } from '@/src/app/[lang]/test-suites/actions';
import { CHAT_COMPLETION_METHOD } from '@/src/components/TestSuites/constants/chat-completion-method';
import { generateMethodPathCombinations } from '@/src/components/TestSuites/utils/method';
import { MenuI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TestSuite, TestSuiteEndpointRef } from '@/src/models/evaluation/test-suite';
import MethodInfo from './MethodInfo';
import MethodItem from './MethodItem';

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
        }));
      } else {
        onChange((prev: TestSuite) => ({
          ...prev,
          endpointRef: {
            method: methods[index].method,
            relativeUrl: methods[index].relativeUrl,
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
          (m) => m.method === testSuite.endpointRef?.method && m.relativeUrl === testSuite.endpointRef?.relativeUrl,
        );
        setActiveMethodIndex(index === -1 ? 0 : index);
      });
    }
  }, [fullApplication, selectedApplication, testSuite.endpointRef?.method, testSuite.endpointRef?.relativeUrl]);

  return (
    <div className="w-full flex flex-row h-full gap-2">
      <DialCollapsibleSidebar containerClassName="border border-primary" title={t(MenuI18nKey.Applications)}>
        <div className="flex flex-col gap-y-1">
          <span className="dial-tiny text-secondary block">{t(TestSuitesI18nKey.ChatInterface)}</span>
          <MethodItem
            key="chat-completion"
            item={CHAT_COMPLETION_METHOD}
            index={0}
            isActive={activeMethodIndex === 0}
            onClick={onMethodClick}
          />
          {!!methods.length && <span className="dial-tiny text-secondary block">{t(TestSuitesI18nKey.Other)}</span>}
          {methods.map((method, index) => (
            <MethodItem
              key={(method?.relativeUrl || '') + method.method}
              item={method}
              index={index + 1}
              isActive={activeMethodIndex === index + 1}
              onClick={onMethodClick}
            />
          ))}
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
