import { createTestSuite, getTestSuites, removeTestSuite } from '@/src/app/[lang]/test-suites/actions';
import EvaluationListView from '@/src/components/ListView/Evaluation/List';
import { TEST_SUITES_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { ApplicationRoute } from '@/src/types/routes';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <EvaluationListView
      baseColumns={TEST_SUITES_COLUMN}
      route={ApplicationRoute.TestSuites}
      getData={getTestSuites}
      onCreateEntity={createTestSuite}
      onRemoveEntity={removeTestSuite}
    />
  );
}
