import { FC } from 'react';

import { createRoute, removeRoute } from '@/src/app/[lang]/routes/actions';
import { SIMPLE_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { DialRoute } from '@/src/models/dial/route';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  data: DialRoute[];
}

const RoutesList: FC<Props> = async ({ data }) => {
  const names = data.map((entity) => entity.name || '');

  return (
    <BaseEntityList
      baseColumns={SIMPLE_ENTITY_COLUMNS}
      names={names}
      data={data}
      route={ApplicationRoute.Routes}
      createEntity={createRoute}
      removeEntity={removeRoute}
    />
  );
};

export default RoutesList;
