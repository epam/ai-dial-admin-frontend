'use client';

import { FC, useMemo } from 'react';

import { METRICS_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { ApplicationRoute } from '@/src/types/routes';
import { removeMetric, createMetric } from '@/src/app/[lang]/metrics/actions';

interface Props {
  data: object[]; // TODO: add type
}

const MetricsList: FC<Props> = ({ data }) => {
  const names = [] as string[]; // TODO: add getting name
  const columns = useMemo(() => {
    return METRICS_COLUMN();
  }, []);

  return (
    <BaseEntityList
      baseColumns={columns}
      names={names}
      data={data}
      route={ApplicationRoute.Metrics}
      onCreateEntity={createMetric}
      onRemoveEntity={removeMetric}
      showColumnsButton
    />
  );
};

export default MetricsList;
