'use client';

import { FC } from 'react';

import { ApplicationRoute } from '@/src/types/routes';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { INTERCEPTOR_TEMPLATES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { createInterceptorTemplate, deleteInterceptorTemplate } from '@/src/app/[lang]/interceptor-templates/actions';
import { filterNames } from '@/src/utils/entities/filter-names';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';

interface Props {
  route: ApplicationRoute;
  data: InterceptorTemplate[];
}

const List: FC<Props> = ({ route, data }) => {
  const names = filterNames(data);

  return (
    <BaseEntityList
      data={data}
      names={names}
      baseColumns={INTERCEPTOR_TEMPLATES_COLUMNS}
      route={route}
      onCreateEntity={createInterceptorTemplate}
      onRemoveEntity={deleteInterceptorTemplate}
    />
  );
};

export default List;
