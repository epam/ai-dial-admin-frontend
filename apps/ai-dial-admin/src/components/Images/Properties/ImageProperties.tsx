import React, { FC, useCallback } from 'react';
import classNames from 'classnames';
import { Image } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { FieldError } from '@/src/models/error';
import { useI18n } from '@/src/locales/client';
import BaseProperties from '@/src/components/Images/Properties/BaseProperties';
import ImageSourceFields from '@/src/components/Images/Properties/ImageSourceFields';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import { getTopics } from '@/src/app/actions/deployments';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, TopicsI18nKey } from '@/src/constants/i18n';
import TransportField from '@/src/components/Common/TransportField/TransportField';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
  isModal?: boolean;
  route: ApplicationRoute;
  setVersionError?: (error: FieldError | null) => void;
}

const ImageProperties: FC<Props> = ({ image, setImage, isModal, route, setVersionError }) => {
  const t = useI18n();

  const containerClassNames = classNames(
    'flex flex-1 flex-col min-h-0 h-full gap-4',
    isModal ? 'px-6 py-4' : 'lg:w-[35%]',
  );

  const onChangeTopics = useCallback(
    (topics: string[]) => {
      setImage({ ...image, topics });
    },
    [image, setImage],
  );

  return (
    <div className={containerClassNames}>
      <BaseProperties image={image} setImage={setImage} isModal={isModal} setVersionError={setVersionError} />
      <ImageSourceFields image={image} setImage={setImage} route={route} />
      {!isModal && (
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
      )}
      {route === ApplicationRoute.McpDeployments && !isModal && <TransportField image={image} setImage={setImage} />}
    </div>
  );
};

export default ImageProperties;
