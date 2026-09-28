'use client';

import { FC, ReactNode } from 'react';

import { createRoute, removeRoute } from '@/src/app/[lang]/routes/actions';
import { ROUTES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { DialRoute } from '@/src/models/dial/route';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  data: DialRoute[];
  /** True when `data` came from Core's config-file population (`config-file-entity-views`), not the admin backend. */
  isConfigFileSource?: boolean;
  headerExtra?: ReactNode;
}

const RoutesList: FC<Props> = ({ data, isConfigFileSource, headerExtra }) => {
  return (
    <BaseEntityList
      baseColumns={ROUTES_COLUMNS}
      names={[]}
      data={data}
      route={ApplicationRoute.Routes}
      onCreateEntity={createRoute}
      onRemoveEntity={removeRoute}
      showColumnsButton
      isConfigFileSource={isConfigFileSource}
      headerExtra={headerExtra}
    />
  );
};

export default RoutesList;
