'use client';
import { FC } from 'react';

import { createKey, removeKey } from '@/src/app/[lang]/keys/actions';
import { KEY_ENTITY_COLUMNS } from '@/src/components/EntityListView/entity-list-view';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { DialKey } from '@/src/models/dial/key';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  data: DialKey[];
}

const KeysList: FC<Props> = ({ data }) => {
  const names = data.map((entity) => entity.name as string);
  const keys = data.map((entity) => entity.key as string);

  return (
    <BaseEntityList
      baseColumns={KEY_ENTITY_COLUMNS}
      names={names}
      keys={keys}
      data={data}
      route={ApplicationRoute.Keys}
      createEntity={createKey}
      removeEntity={removeKey}
      showColumnsButton={true}
    />
  );
};

export default KeysList;
