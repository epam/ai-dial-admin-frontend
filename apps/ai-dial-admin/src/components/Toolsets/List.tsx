'use client';

import { FC } from 'react';

import {
  AUTHOR_COLUMN,
  SIMPLE_ENTITY_COLUMNS,
  SOURCE_FIELD_COLUMNS,
  TOPIC_COLUMN,
} from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { ApplicationRoute } from '@/src/types/routes';
import { Toolset } from '@/src/models/dial/toolset';
import { createToolset, removeToolset } from '@/src/app/[lang]/toolsets/actions';
import { filterNames } from '@/src/utils/entities/filter-names';
import { useI18n } from '@/src/locales/client';

interface Props {
  data: Toolset[];
}

const ToolsetsList: FC<Props> = ({ data }) => {
  const t = useI18n() as (key: string) => string;
  const names = filterNames(data);
  return (
    <BaseEntityList
      baseColumns={[
        ...SIMPLE_ENTITY_COLUMNS,
        ...SOURCE_FIELD_COLUMNS(t, ApplicationRoute.Toolsets),
        AUTHOR_COLUMN,
        TOPIC_COLUMN,
      ]}
      names={names}
      data={data}
      route={ApplicationRoute.Toolsets}
      createEntity={createToolset}
      removeEntity={removeToolset}
    />
  );
};

export default ToolsetsList;
