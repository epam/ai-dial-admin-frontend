import EvaluationListView from '@/src/components/ListView/Evaluation/List';
import { RUNS_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { ApplicationRoute } from '@/src/types/routes';
import { getRuns } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return <EvaluationListView baseColumns={RUNS_COLUMN} route={ApplicationRoute.Runs} getData={getRuns} />;
}
