'use client';

import { FC, useMemo } from 'react';

import { TEST_SUITES_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { ApplicationRoute } from '@/src/types/routes';
import { createTestSuite, removeTestSuite } from '@/src/app/[lang]/test-suites/actions';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import EvaluationListView from '@/src/components/ListView/Evaluation/List';

interface Props {
  data: TestSuite[];
}

const TestSuitesList: FC<Props> = ({ data }) => {
  const names = data.map((suite) => suite.id || '');
  const columns = useMemo(() => {
    return TEST_SUITES_COLUMN();
  }, []);

  return (
    <EvaluationListView
      baseColumns={columns}
      names={names}
      data={data}
      route={ApplicationRoute.TestSuites}
      onCreateEntity={createTestSuite}
      onRemoveEntity={removeTestSuite}
    />
  );
};

export default TestSuitesList;
