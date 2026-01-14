'use client';
import { FC } from 'react';

import { createKey, removeKey } from '@/src/app/[lang]/keys/actions';
import { KEYS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { DialKey } from '@/src/models/dial/key';
import { ApplicationRoute } from '@/src/types/routes';
import { filterNames } from '@/src/utils/entities/filter-names';
import { useI18n } from '@/src/locales/client';

interface Props {
  data: DialKey[];
}

const KeysList: FC<Props> = ({ data }) => {
  const t = useI18n();
  const names = filterNames(data);
  const keys = data.map((entity) => entity.key as string);

  return (
    <BaseEntityList
      baseColumns={KEYS_COLUMNS(t)}
      names={names}
      keys={keys}
      data={data}
      route={ApplicationRoute.Keys}
      onCreateEntity={createKey}
      onRemoveEntity={removeKey}
      showColumnsButton
    />
  );
};

export default KeysList;
