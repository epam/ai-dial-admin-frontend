'use client';

import { FC } from 'react';

import { createApplicationScheme, removeApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import { RUNNERS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  data: DialApplicationScheme[];
}

const ApplicationRunnersList: FC<Props> = ({ data }) => {
  const names = data.map((entity) => entity['dial:applicationTypeDisplayName'] || '');

  return (
    <BaseEntityList
      data={data}
      names={names}
      baseColumns={RUNNERS_COLUMNS}
      route={ApplicationRoute.ApplicationRunners}
      createEntity={createApplicationScheme}
      removeEntity={removeApplicationScheme}
    />
  );
};

export default ApplicationRunnersList;
