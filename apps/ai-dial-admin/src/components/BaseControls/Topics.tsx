'use client';

import { useCallback } from 'react';

import { getModelsTopics } from '@/src/app/[lang]/models/actions';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, TopicsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { isDeploymentAsset } from '@/src/utils/is-view';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';

interface Props<T> {
  entity: T;
  disabled?: boolean;
  view?: ApplicationRoute;
  onChange?: (entity: T) => void;
}

const TopicsControl = <T extends { topics?: string[]; descriptionKeywords?: string[] }>({
  entity,
  onChange,
  disabled,
  view,
  ...props
}: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const selectedItems = [...(isDeploymentAsset(view) ? entity.descriptionKeywords || [] : entity.topics || [])]?.sort();
  const allItems = [...(isDeploymentAsset(view) ? entity.descriptionKeywords || [] : entity.topics || [])]?.sort();

  const onChangeTopics = useCallback(
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
      className={STANDARD_CONTROL_WIDTH}
      selectedItems={selectedItems}
      getItems={getModelsTopics}
      allItems={allItems}
      onChangeItems={onChangeTopics}
      heading={t(EntityFieldsI18nKey.topics)}
      label={t(EntityFieldsI18nKey.topics)}
      addPlaceholder={t(EntityPlaceholdersI18nKey.Topic)}
      addTitle={t(TopicsI18nKey.AddTopic)}
      disabled={disabled || isReadOnlyAdmin}
      {...props}
    />
  );
};

export default TopicsControl;
