'use client';

import { FC, ReactNode } from 'react';

import { createRole, removeRole } from '@/src/app/[lang]/roles/actions';
import { BASE_COLUMNS_WITH_TOPICS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { filterNames } from '@/src/utils/entities/filter-names';

interface Props {
  data: DialRole[];
  /** True when `data` came from Core's config-file population (`config-file-entity-views`), not the admin backend. */
  isConfigFileSource?: boolean;
  headerExtra?: ReactNode;
}

const RolesList: FC<Props> = ({ data, isConfigFileSource, headerExtra }) => {
  const names = filterNames(data);

  return (
    <BaseEntityList
      baseColumns={BASE_COLUMNS_WITH_TOPICS}
      names={names}
      data={data}
      route={ApplicationRoute.Roles}
      onCreateEntity={createRole}
      onRemoveEntity={removeRole}
      isConfigFileSource={isConfigFileSource}
      headerExtra={headerExtra}
    />
  );
};

export default RolesList;
