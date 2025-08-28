'use client';

import { getModelsTopics } from '@/src/app/[lang]/models/actions';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, TopicsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props<T> {
  entity: T;
  onChange: (entity: T) => void;
}

const TopicsControl = <T extends { topics?: string[] }>({ entity, onChange }: Props<T>) => {
  const t = useI18n();

  return (
    <Multiselect
      elementId="topics"
      selectedItems={entity.topics}
      getItems={getModelsTopics}
      allItems={entity.topics}
      optional={true}
      onChangeItems={(topics: string[]) => {
        onChange({ ...entity, topics });
      }}
      heading={t(EntityFieldsI18nKey.topics)}
      title={t(EntityFieldsI18nKey.topics)}
      addPlaceholder={t(EntityPlaceholdersI18nKey.Topic)}
      addTitle={t(TopicsI18nKey.AddTopic)}
    />
  );
};

export default TopicsControl;
