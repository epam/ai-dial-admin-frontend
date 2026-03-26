'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialCollapsibleSidebar, DialConditionalResizableContainer, DialLoader } from '@epam/ai-dial-ui-kit';

import { getDeployment } from '@/src/app/[lang]/test-suites/actions';
import { CHAT_COMPLETION_BODY } from '@/src/components/TestSuites/constants/chat-completion-body';
import { CHAT_COMPLETION_METHOD } from '@/src/components/TestSuites/constants/chat-completion-method';
import { CHAT_COMPLETION_RELATIVE_URL } from '@/src/components/TestSuites/constants/methods';
import { generateMethodPathCombinations } from '@/src/components/TestSuites/utils/method';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
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
  const [isLoading, setIsLoading] = useState(true);

  const methodInfo = useMemo(() => {
    if (activeMethodIndex == null) return {};
    if (activeMethodIndex === 0) return CHAT_COMPLETION_METHOD;
    return methods[activeMethodIndex - 1] ?? {};
  }, [activeMethodIndex, methods]);

  const onMethodClick = useCallback(
    (index: number) => {
      setActiveMethodIndex(index);
      if (index === 0) {
        onChange((prev: TestSuite) => ({
          ...prev,
          endpointRef: CHAT_COMPLETION_METHOD,
          requestTemplate: {
            urlTemplate: CHAT_COMPLETION_RELATIVE_URL,
            body: {
              contentType: APPLICATION_JSON_TYPE,
              content: CHAT_COMPLETION_BODY,
            },
          },
        }));
      } else {
        const route = methods[index - 1];
        if (!route) return;
        onChange((prev: TestSuite) => ({
          ...prev,
          endpointRef: {
            method: route.method,
            relativeUrlPattern: route.relativeUrlPattern,
          },
          requestTemplate: {
            urlTemplate: route.relativeUrlPattern,
          },
        }));
      }
    },
    [methods, onChange],
  );

  useEffect(() => {
    if (!fullApplication && selectedApplication) {
      const { deploymentId, $type } = selectedApplication;
      getDeployment(deploymentId, $type)
        .then((data) => {
          setFullApplication(data);
          const loadedMethods = generateMethodPathCombinations(data?.routes);
          setMethods(loadedMethods);

          const routeIndex = loadedMethods.findIndex(
            (m) =>
              m.method === testSuite.endpointRef?.method &&
              m.relativeUrlPattern === testSuite.endpointRef?.relativeUrlPattern,
          );
          if (routeIndex === -1) {
            if (isCreate) {
              onMethodClick(0);
            }
          } else {
            setActiveMethodIndex(routeIndex + 1);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullApplication, selectedApplication]);

  const [sidebarCurrentWidth, setSidebarCurrentWidth] = useState(400);
  const [isSidebarOpened, setIsSidebarOpened] = useState(true);
  const sidebarThrottledRef = useRef<number | null>(null);
  const sidebarResizingHandler = (width: number) => {
    if (sidebarThrottledRef.current === null) {
      sidebarThrottledRef.current = requestAnimationFrame(() => {
        setSidebarCurrentWidth(width);
        sidebarThrottledRef.current = null;
      });
    }
  };
  return isLoading ? (
    <DialLoader size={40} />
  ) : (
    <div className="flex flex-row size-full gap-2">
      <DialConditionalResizableContainer
        defaultWidth={sidebarCurrentWidth}
        width={sidebarCurrentWidth}
        onResizeStop={setSidebarCurrentWidth}
        onResize={sidebarResizingHandler}
        minWidth={100}
        maxWidth={600}
        enabled={isSidebarOpened}
      >
        <DialCollapsibleSidebar
          width={sidebarCurrentWidth}
          containerClassName="border border-primary h-full"
          title={t(TestSuitesI18nKey.Methods)}
          isOpened={isSidebarOpened}
          onToggle={setIsSidebarOpened}
        >
          <div className="flex flex-col gap-y-4">
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
              {methods.map((method, routeIndex) => (
                <MethodItem
                  key={(method?.relativeUrlPattern || '') + method.method}
                  item={method}
                  index={routeIndex + 1}
                  isActive={activeMethodIndex === routeIndex + 1}
                  onClick={onMethodClick}
                />
              ))}
            </div>
          </div>
        </DialCollapsibleSidebar>
      </DialConditionalResizableContainer>
      <div className="flex-1 min-w-0 border border-primary rounded">
        {activeMethodIndex != null && (
          <MethodInfo
            testSuite={{
              ...testSuite,
              endpointRef: {
                ...testSuite.endpointRef,
                ...methodInfo,
              },
            }}
            onChangeTestSuite={onChange}
          />
        )}
      </div>
    </div>
  );
};

export default Methods;
