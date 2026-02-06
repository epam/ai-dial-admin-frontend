'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { DialCollapsibleSidebar } from '@epam/ai-dial-ui-kit';

import { getDeployment } from '@/src/app/[lang]/test-suites/actions';
import { CHAT_COMPLETION_METHOD } from '@/src/components/TestSuites/constants/chat-completion-method';
import { CHAT_COMPLETION_RELATIVE_URL } from '@/src/components/TestSuites/constants/methods';
import { generateMethodPathCombinations } from '@/src/components/TestSuites/utils/method';
import { MenuI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import MethodInfo from './MethodInfo';
import MethodItem from './MethodItem';

interface Props {
  testSuite: TestSuite;
  selectedApplication?: Deployment | null;
  onChange: Dispatch<SetStateAction<TestSuite>>;
}

const Methods: FC<Props> = ({ testSuite, selectedApplication, onChange }) => {
  const t = useI18n();

  const [activeMethodIndex, setActiveMethodIndex] = useState<number | null>();
  const [fullApplication, setFullApplication] = useState<Deployment | null>();

  const methods = useMemo(
    () => generateMethodPathCombinations(selectedApplication?.routes),
    [selectedApplication?.routes],
  );

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
      });
    }
  }, [fullApplication, selectedApplication]);

  return (
    <div className="w-full flex flex-row h-full gap-2">
      <DialCollapsibleSidebar containerClassName="border border-primary" title={t(MenuI18nKey.Applications)}>
        <div className="flex flex-col gap-y-1">
          <span className="dial-tiny text-secondary block">Chat interface</span>
          <MethodItem
            key="chat-completion"
            item={{ method: 'POST', relativeUrl: CHAT_COMPLETION_RELATIVE_URL }}
            index={0}
            isActive={activeMethodIndex === 0}
            onClick={onMethodClick}
          />
          {!!methods.length && <span className="dial-tiny text-secondary block">Other</span>}
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
            endpoint={
              activeMethodIndex != null
                ? {
                    ...testSuite.endpointRef,
                    ...(activeMethodIndex === 0 ? CHAT_COMPLETION_METHOD : methods[activeMethodIndex]),
                  }
                : {}
            }
            onChange={onChange}
          />
        }
      </div>
    </div>
  );
};

export default Methods;
