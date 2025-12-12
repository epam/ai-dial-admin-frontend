'use client';

import { FC } from 'react';

import { createApplicationScheme, removeApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import { LIST_RUNNER_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  data: DialApplicationScheme[];
}

const ApplicationRunnersList: FC<Props> = ({ data }) => {
  const names = data?.reduce((acc, curr) => {
    if (curr.$id != null) {
      acc.push(curr.$id);
    }
    return acc;
  }, [] as string[]) as string[];

  return (
    <BaseEntityList
      data={data}
      names={names}
      baseColumns={LIST_RUNNER_COLUMNS}
      route={ApplicationRoute.ApplicationRunners}
      onCreateEntity={createApplicationScheme}
      onRemoveEntity={removeApplicationScheme}
    />
  );
};

export default ApplicationRunnersList;
