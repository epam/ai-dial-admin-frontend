'use client';

import { FC } from 'react';

import { AUTHOR_COLUMN, SIMPLE_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { ApplicationRoute } from '@/src/types/routes';
import { DialToolset } from '@/src/models/dial/toolset';
import { createToolset, removeToolset } from '@/src/app/[lang]/toolsets/actions';

interface Props {
  data: DialToolset[];
}

const ToolsetsList: FC<Props> = ({ data }) => {
  const names = data?.reduce((acc, curr) => {
    if (curr.name != null) {
      acc.push(curr.name);
    }
    return acc;
  }, [] as string[]) as string[];

  return (
    <BaseEntityList
      baseColumns={[...SIMPLE_ENTITY_COLUMNS, AUTHOR_COLUMN]}
      names={names}
      data={data}
      route={ApplicationRoute.Toolsets}
      createEntity={createToolset}
      removeEntity={removeToolset}
    />
  );
};

export default ToolsetsList;
