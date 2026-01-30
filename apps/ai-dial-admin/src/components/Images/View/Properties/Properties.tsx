import { FC } from 'react';
import { DialLabelledText } from '@epam/ai-dial-ui-kit';

import { Image, ImageVersion } from '@/src/models/deployments/images';
import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { IMAGE_TYPE_I18N_KEYS, SOURCE_TYPES } from '@/src/constants/deployments/images';
import { useI18n } from '@/src/locales/client';

import ImageFields from '@/src/components/Images/Fields/ImageFields';
import StatusIndicator from '@/src/components/Deployments/Common/StatusIndicator/StatusIndicator';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';

interface Props {
  image: Image;
  setImage: (server: Image) => void;
  originalName: string;
  setImageVersions: (versions: ImageVersion[]) => void;
}

const Properties: FC<Props> = ({ image, setImage, originalName, setImageVersions }) => {
  const t = useI18n();

  const sourcesList = SOURCE_TYPES(t);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary">
        <LabelledText label={t(EntityFieldsI18nKey.id)} text={originalName} tooltip={originalName} copyable={true} />
        <DialLabelledText label={t(EntityFieldsI18nKey.type)} text={t(IMAGE_TYPE_I18N_KEYS[image.$type])} />
        <DialLabelledText
          label={t(EntityFieldsI18nKey.createdAt)}
          text={formatDateTimeToLocalString(image?.createdAt)}
        />
        <DialLabelledText
          label={t(EntityFieldsI18nKey.updatedAt)}
          text={formatDateTimeToLocalString(image?.updatedAt)}
        />
        <DialLabelledText
          label={t(EntitiesI18nKey.SourceType)}
          text={sourcesList?.find((source) => source.value === image.source.$type)?.label}
        />
        <DialLabelledText label={t(EntityFieldsI18nKey.status)}>
          <StatusIndicator status={image.buildStatus} />
        </DialLabelledText>
      </div>
      <div className="flex-1 min-h-0 pt-8">
        <ImageFields image={image} setImage={setImage} setImageVersions={setImageVersions} />
      </div>
    </div>
  );
};

export default Properties;
