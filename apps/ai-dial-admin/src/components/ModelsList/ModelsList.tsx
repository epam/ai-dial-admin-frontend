'use client';

import { FC } from 'react';

import { createModel, removeModel } from '@/src/app/[lang]/models/actions';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { useI18n } from '@/src/locales/client';
import { ENTITY_WITH_VERSION_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { DialAdapter } from '@/src/models/dial/adapter';

interface Props {
  data: DialModel[];
  adapters: DialAdapter[];
}

const ModelsList: FC<Props> = ({ data, adapters }) => {
  const names = data.map((entity) => entity.displayName || '');
  const t = useI18n() as (stringToTranslate: string) => string;

  return (
    <BaseEntityList
      names={names}
      baseColumns={ENTITY_WITH_VERSION_COLUMNS(t, adapters)}
      data={data}
      route={ApplicationRoute.Models}
      createEntity={createModel}
      removeEntity={removeModel}
      showColumnsButton={true}
    />
  );
};

export default ModelsList;
