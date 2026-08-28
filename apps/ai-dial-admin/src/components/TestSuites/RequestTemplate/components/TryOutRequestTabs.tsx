'use client';

import { FC, useMemo } from 'react';

import { DialTabs, TabModel } from '@epam/ai-dial-ui-kit';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { getRequestCount, getRequestLabel } from '@/src/utils/evaluation/request-chain';

interface Props {
  testSuite: TestSuite;
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const TryOutRequestTabs: FC<Props> = ({ testSuite, selectedIndex, onSelect }) => {
  const t = useI18n();
  const requestWord = t(TestSuitesI18nKey.Request);

  const tabs: TabModel[] = useMemo(
    () =>
      Array.from({ length: getRequestCount(testSuite) }, (_, index) => ({
        id: String(index),
        label: getRequestLabel(testSuite, index, requestWord),
      })),
    [testSuite, requestWord],
  );

  return <DialTabs tabs={tabs} activeTab={String(selectedIndex)} onClick={(id) => onSelect(Number(id))} />;
};

export default TryOutRequestTabs;
