import { FC } from 'react';

import { createInterceptor, removeInterceptor } from '@/src/app/[lang]/interceptors/actions';
import { SIMPLE_ENTITY_COLUMNS } from '@/src/components/EntityListView/entity-list-view';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  data: DialInterceptor[];
}

const InterceptorsList: FC<Props> = async ({ data }) => {
  const names = data.map((entity) => entity.name || '');

  return (
    <BaseEntityList
      baseColumns={SIMPLE_ENTITY_COLUMNS}
      names={names}
      data={data}
      route={ApplicationRoute.Interceptors}
      createEntity={createInterceptor}
      removeEntity={removeInterceptor}
    />
  );
};

export default InterceptorsList;
