import { FC, useCallback } from 'react';
import { DialSelectField } from '@epam/ai-dial-ui-kit';

import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { IMAGE_SOURCE_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import { Image } from '@/src/models/deployments/images';
import { setTransport } from '@/src/utils/deployments/images';
import { DEFAULT_IMAGE_SOURCE, IMAGE_TYPES, SOURCE_TYPES } from '@/src/constants/deployments/images';
import { useI18n } from '@/src/locales/client';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
  isModal?: boolean;
  verifyVersion: (image: Image) => void;
}

const SourceType: FC<Props> = ({ image, setImage, isModal, verifyVersion }) => {
  const t = useI18n();
  const sourcesList = SOURCE_TYPES(t);
  const imageTypesList = IMAGE_TYPES(t);

  const onImageTypeChange = useCallback(
    ($type: string | string[]) => {
      const updated = {
        ...setTransport(image),
        $type: $type as IMAGE_TYPE,
        source: DEFAULT_IMAGE_SOURCE,
      };
      verifyVersion(updated);
      setImage(updated);
    },
    [image, setImage, verifyVersion],
  );

  const onSourceTypeChange = useCallback(
    ($type: string | string[]) => {
      setImage({
        ...image,
        source: {
          $type: $type as IMAGE_SOURCE_TYPE,
        },
      });
    },
    [image, setImage],
  );

  return (
    <div className="flex gap-x-4">
      {isModal && (
        <DialSelectField
          id="imagesType"
          containerClassName="w-[220px]"
          value={image.$type}
          options={imageTypesList}
          label={t(EntityFieldsI18nKey.type)}
          onChange={onImageTypeChange}
        />
      )}
      {image.$type === IMAGE_TYPE.MCP && (
        <DialSelectField
          id="sourceType"
          containerClassName="w-[220px]"
          value={image.source.$type}
          options={sourcesList}
          label={t(EntitiesI18nKey.SourceType)}
          onChange={onSourceTypeChange}
        />
      )}
    </div>
  );
};

export default SourceType;
