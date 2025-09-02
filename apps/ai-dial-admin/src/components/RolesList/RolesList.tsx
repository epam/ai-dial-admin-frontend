import { FC } from 'react';

import { createRole, removeRole } from '@/src/app/[lang]/roles/actions';
import { SIMPLE_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  data: DialRole[];
}

const RolesList: FC<Props> = ({ data }) => {
  const names = data?.reduce((acc, curr) => {
    if (curr.name != null) {
      acc.push(curr.name);
    }
    return acc;
  }, [] as string[]) as string[];

  return (
    <BaseEntityList
      baseColumns={SIMPLE_ENTITY_COLUMNS}
      names={names}
      data={data}
      route={ApplicationRoute.Roles}
      createEntity={createRole}
      removeEntity={removeRole}
    />
  );
};

export default RolesList;
