'use client';

import { FC, useMemo } from 'react';

import { TEST_SUITS_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { ApplicationRoute } from '@/src/types/routes';
import { removeSuit, createSuit } from '@/src/app/[lang]/test-suits/actions';

interface Props {
  data: object[]; // TODO: add type
}

const TestSuitsList: FC<Props> = ({ data }) => {
  const names = [] as string[]; // TODO: add getting name
  const columns = useMemo(() => {
    return TEST_SUITS_COLUMN();
  }, []);

  return (
    <BaseEntityList
      baseColumns={columns}
      names={names}
      data={data}
      route={ApplicationRoute.TestSuits}
      onCreateEntity={createSuit}
      onRemoveEntity={removeSuit}
      showColumnsButton
    />
  );
};

export default TestSuitsList;
