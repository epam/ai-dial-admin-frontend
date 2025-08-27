import { FC } from 'react';

import { createRoute, removeRoute } from '@/src/app/[lang]/routes/actions';
import { SIMPLE_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { ApplicationRoute } from '@/src/types/routes';
import { DialToolset } from '@/src/models/dial/toolset';

interface Props {
  data: DialToolset[];
}

const ToolsetsList: FC<Props> = async ({ data }) => {
  const names = data.map((entity) => entity.name || '');

  return (
    <BaseEntityList
      baseColumns={SIMPLE_ENTITY_COLUMNS}
      names={names}
      data={data}
      route={ApplicationRoute.Toolsets}
      createEntity={createRoute}
      removeEntity={removeRoute}
    />
  );
};

export default ToolsetsList;
