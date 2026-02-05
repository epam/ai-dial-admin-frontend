'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { DialCollapsibleSidebar } from '@epam/ai-dial-ui-kit';

import { getDeployment } from '@/src/app/[lang]/test-suites/actions';
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
      onChange((prev: TestSuite) => ({
        ...prev,
        endpointRef: {
          method: methods[index].method,
          relativeUrl: methods[index].relativeUrl,
        },
      }));
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
          {methods.map((method, index) => (
            <MethodItem
              key={(method?.relativeUrl || '') + method.method}
              item={method}
              index={index}
              isActive={activeMethodIndex === index}
              onClick={onMethodClick}
            />
          ))}
        </div>
      </DialCollapsibleSidebar>

      <div className="flex-1 min-w-0 border border-primary rounded">
        {!!methods.length && (
          <MethodInfo
            endpoint={activeMethodIndex != null ? { ...testSuite.endpointRef, ...methods[activeMethodIndex] } : {}}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  );
};

export default Methods;
