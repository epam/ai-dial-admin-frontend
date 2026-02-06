'use client';
import { FC, useMemo } from 'react';

import { createInterceptor, removeInterceptor } from '@/src/app/[lang]/interceptors/actions';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { INTERCEPTORS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';
import { filterNames } from '@/src/utils/entities/filter-names';

interface Props {
  data: DialInterceptor[];
}

const InterceptorsList: FC<Props> = ({ data }) => {
  const t = useI18n();
  const names = filterNames(data);
  const columns = useMemo(() => INTERCEPTORS_COLUMNS(t), [t]);

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
