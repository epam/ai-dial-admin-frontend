'use client';

import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react';

import { DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';

import { getRoute } from '@/src/app/[lang]/test-suites/actions';
import Methods from '@/src/components/TestSuites/Methods/Methods';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialRouteResource } from '@/src/models/dial/resource';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  routeName: string;
  testSuite: TestSuite;
  onChange: Dispatch<SetStateAction<TestSuite>>;
  isCreate?: boolean;
  children?: ReactNode;
}

const RouteMethods: FC<Props> = ({ routeName, testSuite, onChange, isCreate, children }) => {
  const t = useI18n();
  const [route, setRoute] = useState<DialRouteResource | null>();

  useEffect(() => {
    let isCancelled = false;
    setRoute(undefined);

    const loadRoute = async () => {
      try {
        const result = await getRoute(routeName);
        if (!isCancelled) {
          setRoute(result);
        }
      } catch {
        if (!isCancelled) {
          setRoute(null);
        }
      }
    };

    void loadRoute();
    return () => {
      isCancelled = true;
    };
  }, [routeName]);

  if (route === undefined) {
    return <DialLoader size={40} />;
  }

  if (route === null) {
    return <DialNoDataContent title={t(EntitiesI18nKey.NoRoutes)} />;
  }

  return (
    <Methods selectedRoute={route} testSuite={testSuite} onChange={onChange} isCreate={isCreate}>
      {children}
    </Methods>
  );
};

export default RouteMethods;
