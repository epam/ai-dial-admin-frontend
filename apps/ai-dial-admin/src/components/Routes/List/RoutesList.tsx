'use client';

import { FC } from 'react';

import { createRoute, removeRoute } from '@/src/app/[lang]/routes/actions';
import { ROUTES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { DialRoute } from '@/src/models/dial/route';
import { ApplicationRoute } from '@/src/types/routes';
import { filterNames } from '@/src/utils/entities/filter-names';

interface Props {
  data: DialRoute[];
}

const RoutesList: FC<Props> = ({ data }) => {
  const names = filterNames(data);
  return (
    <BaseEntityList
      baseColumns={ROUTES_COLUMNS}
      names={names}
      data={data}
      route={ApplicationRoute.Routes}
      onCreateEntity={createRoute}
      onRemoveEntity={removeRoute}
      showColumnsButton
    />
  );
};

export default RoutesList;
