'use client';

import { FC } from 'react';

import { createAdapter, removeAdapter } from '@/src/app/[lang]/adapters/actions';
import { ADAPTER_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { DialAdapter } from '@/src/models/dial/adapter';
import { ApplicationRoute } from '@/src/types/routes';
import { filterNames } from '@/src/utils/entities/filter-names';
import { useI18n } from '@/src/locales/client';
interface Props {
  data: DialAdapter[];
}

const AdaptersList: FC<Props> = ({ data }) => {
  const t = useI18n();
  const names = filterNames(data);
  return (
    <BaseEntityList
      names={names}
      baseColumns={ADAPTER_COLUMNS(t)}
      data={data}
      route={ApplicationRoute.Adapters}
      onCreateEntity={createAdapter}
      onRemoveEntity={removeAdapter}
      showColumnsButton={true}
    />
  );
};

export default AdaptersList;
