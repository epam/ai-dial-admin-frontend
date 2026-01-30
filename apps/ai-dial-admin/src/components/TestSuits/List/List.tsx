'use client';

import { FC, useMemo } from 'react';

import { TEST_SUITS_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { ApplicationRoute } from '@/src/types/routes';
import { removeSuit, createSuit } from '@/src/app/[lang]/test-suits/actions';
import { TestSuits } from '@/src/models/evaluation/test-suit';
import EvaluationListView from '@/src/components/ListView/Evaluation/List';

interface Props {
  data: TestSuits[];
}

const TestSuitsList: FC<Props> = ({ data }) => {
  const names = data.map((suit) => suit.id);
  const columns = useMemo(() => {
    return TEST_SUITS_COLUMN();
  }, []);

  return (
    <EvaluationListView
      baseColumns={columns}
      names={names}
      data={data}
      route={ApplicationRoute.TestSuits}
      onCreateEntity={createSuit}
      onRemoveEntity={removeSuit}
    />
  );
};

export default TestSuitsList;
