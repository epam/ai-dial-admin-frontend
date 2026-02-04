'use client';

import { FC, useMemo } from 'react';

import { RUNS_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { ApplicationRoute } from '@/src/types/routes';
import { createRun, removeRun } from '@/src/app/[lang]/runs/actions';

interface Props {
  data: object[]; // TODO: add type
}

const RunsList: FC<Props> = ({ data }) => {
  const names = [] as string[]; // TODO: add getting name
  const columns = useMemo(() => {
    return RUNS_COLUMN();
  }, []);

  return (
    <BaseEntityList
      baseColumns={columns}
      names={names}
      data={data}
      route={ApplicationRoute.Runs}
      onCreateEntity={createRun}
      onRemoveEntity={removeRun}
      showColumnsButton
    />
  );
};

export default RunsList;
