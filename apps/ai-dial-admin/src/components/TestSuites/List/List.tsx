'use client';

import { FC, useMemo } from 'react';

import { createTestSuite, getTestSuites, removeTestSuite } from '@/src/app/[lang]/test-suites/actions';
import EvaluationListView from '@/src/components/ListView/Evaluation/List';
import { TEST_SUITES_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { ApplicationRoute } from '@/src/types/routes';

const TestSuitesList: FC = () => {
  const columns = useMemo(() => {
    return TEST_SUITES_COLUMN();
  }, []);

  return (
    <EvaluationListView
      baseColumns={columns}
      route={ApplicationRoute.TestSuites}
      getData={getTestSuites}
      onCreateEntity={createTestSuite}
      onRemoveEntity={removeTestSuite}
    />
  );
};

export default TestSuitesList;
