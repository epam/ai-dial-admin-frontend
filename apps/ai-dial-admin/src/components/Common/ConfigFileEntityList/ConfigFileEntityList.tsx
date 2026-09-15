'use client';

import { FC, ReactNode, useMemo } from 'react';

import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { NAME_COLUMN_WITH_SORT } from '@/src/constants/grid-columns/base-columns';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  names: string[];
  route: ApplicationRoute;
  headerExtra?: ReactNode;
}

/**
 * The `config-file-entity-views` list swap's shared, name-only list — one component for all seven
 * covered entity types instead of each rendering its own full-columns admin-grid list. Config-file
 * entities have no write endpoint, so `onRemoveEntity` is unreachable: `isConfigFileSource` marks the
 * entity read-only, which hides the remove/duplicate/move actions `BaseEntityList` would otherwise
 * wire it to.
 */
const ConfigFileEntityList: FC<Props> = ({ names, route, headerExtra }) => {
  const data = useMemo(() => names.map((name) => ({ name })), [names]);

  return (
    <BaseEntityList
      data={data}
      baseColumns={[NAME_COLUMN_WITH_SORT]}
      route={route}
      onRemoveEntity={async () => ({ success: false })}
      isConfigFileSource
      headerExtra={headerExtra}
    />
  );
};

export default ConfigFileEntityList;
