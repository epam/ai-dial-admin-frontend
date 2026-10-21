'use client';

import { useCallback } from 'react';

import { getModelsTopics } from '@/src/app/[lang]/models/actions';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, TopicsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { hasTopicCatalogue, isDeploymentAsset } from '@/src/utils/is-view';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';

interface Props<T> {
  entity: T;
  disabled?: boolean;
  view?: ApplicationRoute;
  onChange?: (entity: T) => void;
}

const TopicsControl = <
  T extends { topics?: string[]; description_keywords?: string[]; descriptionKeywords?: string[] },
>({
  entity,
  onChange,
  disabled,
  view,
  ...props
}: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isAssetModels = view === ApplicationRoute.PlatformModels || view === ApplicationRoute.PlatformInterceptors;
  const currentTopics = isDeploymentAsset(view)
    ? entity.description_keywords
    : isAssetModels
      ? entity.descriptionKeywords
      : entity.topics;
  const selectedItems = [...(currentTopics || [])]?.sort();
  const allItems = [...(currentTopics || [])]?.sort();

  const onChangeTopics = useCallback(
    (items: string[]) => {
      if (isDeploymentAsset(view)) {
        onChange?.({ ...entity, description_keywords: items });
      } else if (isAssetModels) {
        onChange?.({ ...entity, descriptionKeywords: items });
      } else {
        onChange?.({ ...entity, topics: items });
      }
    },
    [entity, onChange, view, isAssetModels],
  );

  return (
    <Multiselect
      elementId="topics"
      className={STANDARD_CONTROL_WIDTH}
      selectedItems={selectedItems}
      getItems={hasTopicCatalogue(view) ? getModelsTopics : void 0}
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
