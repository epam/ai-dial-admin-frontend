import { FC } from 'react';

import { createInterceptor, removeInterceptor } from '@/src/app/[lang]/interceptors/actions';
import { AUTHOR_COLUMN, SIMPLE_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';
import { filterNames } from '@/src/utils/entities/filter-names';

interface Props {
  data: DialInterceptor[];
}

const InterceptorsList: FC<Props> = async ({ data }) => {
  const names = filterNames(data);
  return (
    <BaseEntityList
      baseColumns={[...SIMPLE_ENTITY_COLUMNS, AUTHOR_COLUMN]}
      names={names}
      data={data}
      route={ApplicationRoute.Interceptors}
      createEntity={createInterceptor}
      removeEntity={removeInterceptor}
    />
  );
};

export default InterceptorsList;
