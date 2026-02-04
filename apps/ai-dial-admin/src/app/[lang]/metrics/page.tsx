import EvaluationListView from '@/src/components/ListView/Evaluation/List';
import { METRICS_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { ApplicationRoute } from '@/src/types/routes';
import { getMetrics } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return <EvaluationListView baseColumns={METRICS_COLUMN} route={ApplicationRoute.Metrics} getData={getMetrics} />;
}
