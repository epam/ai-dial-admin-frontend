'use client';

import { FC, useMemo } from 'react';

import EvaluationListView from '@/src/components/ListView/Evaluation/List';
import { METRICS_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  data: object[]; // TODO: add type
}

const MetricsList: FC<Props> = ({ data }) => {
  const columns = useMemo(() => {
    return METRICS_COLUMN();
  }, []);

  return <EvaluationListView baseColumns={columns} names={[]} data={data} route={ApplicationRoute.Metrics} />;
};

export default MetricsList;
