'use client';

import { FC } from 'react';

import { createAdapter, removeAdapter } from '@/src/app/[lang]/adapters/actions';
import { BASE_COLUMNS_WITH_TOPICS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { DialAdapter } from '@/src/models/dial/adapter';
import { ApplicationRoute } from '@/src/types/routes';
import { filterNames } from '@/src/utils/entities/filter-names';
interface Props {
  data: DialAdapter[];
}

const AdaptersList: FC<Props> = ({ data }) => {
  const names = filterNames(data);
  return (
    <BaseEntityList
      names={names}
      baseColumns={BASE_COLUMNS_WITH_TOPICS}
      data={data}
      route={ApplicationRoute.Adapters}
      onCreateEntity={createAdapter}
      onRemoveEntity={removeAdapter}
    />
  );
};

export default AdaptersList;
