'use client';
import { FC } from 'react';

import { createKey, removeKey } from '@/src/app/[lang]/keys/actions';
import { KEYS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { DialKey } from '@/src/models/dial/key';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  data: DialKey[];
}

const KeysList: FC<Props> = ({ data }) => {
  const names = (data?.filter((entity) => entity.name).map((entity) => entity.name) || []) as string[];

  const keys = data.map((entity) => entity.key as string);

  return (
    <BaseEntityList
      baseColumns={KEYS_COLUMNS}
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
