'use client';

import { FC } from 'react';

import { createAddon, removeAddon } from '@/src/app/[lang]/addons/actions';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { useI18n } from '@/src/locales/client';
import { ENTITY_WITH_VERSION_COLUMNS } from '@/src/components/EntityListView/entity-list-view';

interface Props {
  data: DialModel[];
}

const hiddenFields = [
  'type',
  'overrideName',
  'tokenizerModel',
  'limits.maxTotalTokens',
  'pricing.prompt',
  'pricing.completion',
];

const AddonsList: FC<Props> = ({ data }) => {
  const names = data.map((entity) => entity.displayName || '');
  const t = useI18n() as (stringToTranslate: string) => string;

  return (
    <BaseEntityList
      names={names}
      baseColumns={ENTITY_WITH_VERSION_COLUMNS(t).filter((c) => !hiddenFields?.includes(c.field as string))}
      data={data}
      route={ApplicationRoute.Addons}
      createEntity={createAddon}
      removeEntity={removeAddon}
      showColumnsButton={true}
    />
  );
};

export default AddonsList;
