'use client';

import { useCallback } from 'react';

import { getModelsTopics } from '@/src/app/[lang]/models/actions';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, TopicsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { isDeploymentAsset } from '@/src/utils/is-asset-view';

interface Props<T> {
  entity: T;
  disabled?: boolean;
  onChange?: (entity: T) => void;
  view?: ApplicationRoute;
}

const TopicsControl = <T extends { topics?: string[]; descriptionKeywords?: string[] }>({
  entity,
  onChange,
  view,
  ...props
}: Props<T>) => {
  const t = useI18n();
  const selectedItems = isDeploymentAsset(view) ? entity.descriptionKeywords : entity.topics;
  const allItems = isDeploymentAsset(view) ? entity.descriptionKeywords : entity.topics;

  const changeTopics = useCallback(
    (items: string[]) => {
      if (isDeploymentAsset(view)) {
        onChange?.({ ...entity, descriptionKeywords: items });
      } else {
        onChange?.({ ...entity, topics: items });
      }
    },
    [entity, onChange, view],
  );

  return (
    <Multiselect
      elementId="topics"
      selectedItems={selectedItems}
      getItems={getModelsTopics}
      allItems={allItems}
      optional={true}
      onChangeItems={changeTopics}
      heading={t(EntityFieldsI18nKey.topics)}
      title={t(EntityFieldsI18nKey.topics)}
      addPlaceholder={t(EntityPlaceholdersI18nKey.Topic)}
      addTitle={t(TopicsI18nKey.AddTopic)}
      {...props}
    />
  );
};

export default TopicsControl;
