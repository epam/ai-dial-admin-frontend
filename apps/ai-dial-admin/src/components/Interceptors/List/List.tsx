'use client';
import { FC } from 'react';

import { createInterceptor, removeInterceptor } from '@/src/app/[lang]/interceptors/actions';
import {
  AUTHOR_COLUMN,
  SIMPLE_ENTITY_COLUMNS,
  SOURCE_FIELD_COLUMNS,
  INTERCEPTOR_STATUS_COLUMN,
} from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';
import { filterNames } from '@/src/utils/entities/filter-names';
import { useI18n } from '@/src/locales/client';

interface Props {
  data: DialInterceptor[];
}

const InterceptorsList: FC<Props> = ({ data }) => {
  const t = useI18n();
  const names = filterNames(data);
  return (
    <BaseEntityList
      baseColumns={[
        ...SIMPLE_ENTITY_COLUMNS,
        INTERCEPTOR_STATUS_COLUMN,
        ...SOURCE_FIELD_COLUMNS(t, ApplicationRoute.Interceptors),
        AUTHOR_COLUMN,
      ]}
      names={names}
      data={data}
      route={ApplicationRoute.Interceptors}
      createEntity={createInterceptor}
      removeEntity={removeInterceptor}
      showColumnsButton={true}
    />
  );
};

export default InterceptorsList;
