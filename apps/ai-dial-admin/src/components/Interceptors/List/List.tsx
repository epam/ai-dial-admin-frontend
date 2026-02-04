'use client';
import { FC, useMemo } from 'react';

import { createInterceptor, removeInterceptor } from '@/src/app/[lang]/interceptors/actions';
import {
  AUTHOR_COLUMN,
  SOURCE_FIELD_COLUMNS,
  BASE_STATUS_COLUMN,
  SIMPLE_ENTITY_COLUMNS_WITH_TOPICS,
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
  const columns = useMemo(() => {
    return [
      ...SIMPLE_ENTITY_COLUMNS_WITH_TOPICS,
      BASE_STATUS_COLUMN,
      ...SOURCE_FIELD_COLUMNS(t, ApplicationRoute.Interceptors),
      AUTHOR_COLUMN,
    ];
  }, [t]);

  return (
    <BaseEntityList
      baseColumns={columns}
      names={names}
      data={data}
      route={ApplicationRoute.Interceptors}
      onCreateEntity={createInterceptor}
      onRemoveEntity={removeInterceptor}
      showColumnsButton
    />
  );
};

export default InterceptorsList;
