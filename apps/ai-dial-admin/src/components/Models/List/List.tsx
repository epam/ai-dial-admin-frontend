'use client';

import { FC } from 'react';

import { createModel, removeModel } from '@/src/app/[lang]/models/actions';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { MODELS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import { filterDisplayNamesWithVersions } from '@/src/utils/entities/filter-names';

interface Props {
  data: DialModel[];
}

const ModelsList: FC<Props> = ({ data }) => {
  const names = filterDisplayNamesWithVersions(data);

  const t = useI18n() as (str: string) => string;

  return (
    <BaseEntityList
      names={names}
      baseColumns={MODELS_COLUMNS(t, ApplicationRoute.Models)}
      data={data}
      route={ApplicationRoute.Models}
      createEntity={createModel}
      removeEntity={removeModel}
      showColumnsButton={true}
    />
  );
};

export default ModelsList;
