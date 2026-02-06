'use client';

import { FC, useMemo } from 'react';

import { createToolset, removeToolset } from '@/src/app/[lang]/toolsets/actions';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { TOOLSETS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';
import { Toolset } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import { filterDisplayNames } from '@/src/utils/entities/filter-names';

interface Props {
  data: Toolset[];
}

const ToolsetsList: FC<Props> = ({ data }) => {
  const t = useI18n();
  const names = filterDisplayNames(data);

  const columns = useMemo(() => TOOLSETS_COLUMNS(t), [t]);
  return (
    <BaseEntityList
      baseColumns={columns}
      names={names}
      data={data}
      route={ApplicationRoute.Toolsets}
      onCreateEntity={createToolset}
      onRemoveEntity={removeToolset}
      showColumnsButton={true}
    />
  );
};

export default ToolsetsList;
