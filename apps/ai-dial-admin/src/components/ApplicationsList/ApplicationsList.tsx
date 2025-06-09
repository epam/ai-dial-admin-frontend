'use client';
import { FC } from 'react';

import { createApplication, removeApplication } from '@/src/app/[lang]/applications/actions';
import { ENTITY_WITH_VERSION_COLUMNS } from '@/src/components/EntityListView/entity-list-view';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  data: DialApplication[];
  runners: DialApplicationScheme[];
}

const hiddenFields = [
  'type',
  'overrideName',
  'tokenizerModel',
  'limits.maxTotalTokens',
  'pricing.prompt',
  'pricing.completion',
];

const ApplicationsList: FC<Props> = ({ data, runners }) => {
  const names = data.map((entity) => entity.displayName || '');
  const t = useI18n() as (stringToTranslate: string) => string;

  return (
    <BaseEntityList
      data={data}
      runners={runners}
      names={names}
      baseColumns={ENTITY_WITH_VERSION_COLUMNS(t).filter((c) => !hiddenFields?.includes(c.field as string))}
      route={ApplicationRoute.Applications}
      createEntity={createApplication}
      removeEntity={removeApplication}
      showColumnsButton={true}
    />
  );
};

export default ApplicationsList;
