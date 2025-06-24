'use client';

import { FC } from 'react';

import { createAdapter, removeAdapter } from '@/src/app/[lang]/adapters/actions';
import { SIMPLE_DESCRIPTION_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { DialAdapter } from '@/src/models/dial/adapter';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  data: DialAdapter[];
}

const AdaptersList: FC<Props> = ({ data }) => {
  const names = data.map((entity) => entity.name || '');

  return (
    <BaseEntityList
      names={names}
      baseColumns={SIMPLE_DESCRIPTION_COLUMNS}
      data={data}
      route={ApplicationRoute.Adapters}
      createEntity={createAdapter}
      removeEntity={removeAdapter}
    />
  );
};

export default AdaptersList;
