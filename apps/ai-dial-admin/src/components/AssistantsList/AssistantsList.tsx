'use client';
import { FC } from 'react';

import { DialAssistant } from '@/src/models/dial/assistant';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { ENTITY_WITH_VERSION_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ApplicationRoute } from '@/src/types/routes';
import { createAssistant, removeAssistant } from '@/src/app/[lang]/assistants/actions';
import { useI18n } from '@/src/locales/client';

interface Props {
  data: DialAssistant[];
}

const hiddenFields = [
  'endpoint',
  'type',
  'displayVersion',
  'overrideName',
  'tokenizerModel',
  'pricing.prompt',
  'pricing.completion',
];

const AssistantsList: FC<Props> = ({ data }) => {
  const names = data.map((entity) => entity.displayName || '');
  const t = useI18n() as (stringToTranslate: string) => string;

  return (
    <BaseEntityList
      data={data}
      names={names}
      baseColumns={ENTITY_WITH_VERSION_COLUMNS(t).filter((c) => !hiddenFields?.includes(c.field as string))}
      route={ApplicationRoute.Assistants}
      createEntity={createAssistant}
      removeEntity={removeAssistant}
      showColumnsButton={true}
    />
  );
};

export default AssistantsList;
