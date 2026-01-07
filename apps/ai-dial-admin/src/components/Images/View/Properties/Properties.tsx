import { FC } from 'react';
import { DialLabelledText } from '@epam/ai-dial-ui-kit';

import { Image } from '@/src/models/deployments/images';
import { EntitiesI18nKey, EntityFieldsI18nKey, ImagesI18nKey } from '@/src/constants/i18n';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { SOURCE_TYPES } from '@/src/constants/deployments/images';
import { useI18n } from '@/src/locales/client';

import ImageFields from '@/src/components/Images/Fields/ImageFields';
import StatusIndicator from '@/src/components/Deployments/Common/StatusIndicator/StatusIndicator';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';

interface Props {
  image: Image;
  setImage: (server: Image) => void;
  originalName: string;
}

const Properties: FC<Props> = ({ image, setImage, originalName }) => {
  const t = useI18n();

  const sourcesList = SOURCE_TYPES(t);

  return (
    <div className="flex flex-col pt-3 w-full divide-y divide-primary min-h-0 flex-1">
      <div className="flex gap-10 overflow-y-scroll">
        <LabelledText label={t(EntityFieldsI18nKey.id)} text={originalName} tooltip={originalName} copyable={true} />
        <DialLabelledText label={t(EntityFieldsI18nKey.type)} text={t(ImagesI18nKey.Image)} />
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
      <div className="mt-8 pt-8">
        <ImageFields image={image} setImage={setImage} />
      </div>
    </div>
  );
};

export default Properties;
