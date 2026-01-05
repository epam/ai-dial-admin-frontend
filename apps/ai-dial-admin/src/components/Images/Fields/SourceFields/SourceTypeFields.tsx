import { FC } from 'react';
import { DialSelectField } from '@epam/ai-dial-ui-kit';
import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { IMAGE_SOURCE_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import { Image } from '@/src/models/deployments/images';
import { useI18n } from '@/src/locales/client';
import { DEFAULT_IMAGE_SOURCE, IMAGE_TYPES, SOURCE_TYPES } from '@/src/constants/deployments/images';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
  isModal?: boolean;
}

const SourceTypeFields: FC<Props> = ({ image, setImage, isModal }) => {
  const t = useI18n();
  const sourcesList = SOURCE_TYPES(t);
  const imageTypesList = IMAGE_TYPES(t);

  const onImageTypeChange = ($type: IMAGE_TYPE) => {
    setImage({
      ...image,
      $type,
      source: DEFAULT_IMAGE_SOURCE,
    });
  };

  const onSourceTypeChange = ($type: IMAGE_SOURCE_TYPE) => {
    setImage({
      ...image,
      source: {
        $type,
      },
    });
  };

  return (
    <div className="flex gap-4">
      {isModal && (
        <DialSelectField
          elementId="imagesType"
          containerClassName="max-w-[192px]"
          value={image.$type}
          options={imageTypesList}
          fieldTitle={t(EntityFieldsI18nKey.type)}
          onChange={(type) => onImageTypeChange(type as IMAGE_TYPE)}
        />
      )}
      {image.$type === IMAGE_TYPE.MCP && (
        <DialSelectField
          elementId="sourceType"
          containerClassName="max-w-[158px]"
          value={image.source.$type}
          options={sourcesList}
          fieldTitle={t(EntitiesI18nKey.SourceType)}
          onChange={(type) => onSourceTypeChange(type as IMAGE_SOURCE_TYPE)}
        />
      )}
    </div>
  );
};

export default SourceTypeFields;
