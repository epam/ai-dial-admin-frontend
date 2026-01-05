import { FC, useCallback } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, TopicsI18nKey } from '@/src/constants/i18n';
import { Image } from '@/src/models/deployments/images';
import { getTopics } from '@/src/app/actions/deployments';
import { useI18n } from '@/src/locales/client';

import Multiselect from '@/src/components/Common/Multiselect/Multiselect';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
}

const TopicField: FC<Props> = ({ image, setImage }) => {
  const t = useI18n();

  const onChangeTopics = useCallback(
    (topics: string[]) => {
      setImage({ ...image, topics });
    },
    [image, setImage],
  );

  return (
    <Multiselect
      elementId="topics"
      selectedItems={image.topics}
      getItems={getTopics}
      allItems={image.topics}
      onChangeItems={onChangeTopics}
      heading={t(EntityFieldsI18nKey.topics)}
      title={t(EntityFieldsI18nKey.topics)}
      addPlaceholder={t(EntityPlaceholdersI18nKey.Topic)}
      addTitle={t(TopicsI18nKey.AddTopic)}
      optional={true}
    />
  );
};

export default TopicField;
