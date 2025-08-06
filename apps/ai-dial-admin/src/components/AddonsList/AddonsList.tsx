'use client';

import { FC } from 'react';

import { createAddon, removeAddon } from '@/src/app/[lang]/addons/actions';
import { DialAddon } from '@/src/models/dial/addon';
import { ApplicationRoute } from '@/src/types/routes';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { useI18n } from '@/src/locales/client';
import { ENTITY_WITH_VERSION_COLUMNS } from '@/src/constants/grid-columns/grid-columns';

interface Props {
  data: DialAddon[];
}

const AddonsList: FC<Props> = ({ data }) => {
  const names = data.map((entity) => entity.displayName || '');
  const t = useI18n() as (stringToTranslate: string) => string;

  return (
    <BaseEntityList
      names={names}
      baseColumns={ENTITY_WITH_VERSION_COLUMNS(t)}
      data={data}
      route={ApplicationRoute.Addons}
      createEntity={createAddon}
      removeEntity={removeAddon}
      showColumnsButton={true}
    />
  );
};

export default AddonsList;
