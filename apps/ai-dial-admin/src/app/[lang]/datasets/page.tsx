import { createDataset, getDatasets, removeDataset } from '@/src/app/[lang]/datasets/actions';
import EvaluationListView from '@/src/components/ListView/Evaluation/List';
import { DATASETS_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { ApplicationRoute } from '@/src/types/routes';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <EvaluationListView
      baseColumns={DATASETS_COLUMN}
      route={ApplicationRoute.Datasets}
      getData={getDatasets}
      onCreateEntity={createDataset}
      onRemoveEntity={removeDataset}
    />
  );
}
