import { FC } from 'react';
import { DialLabelledText } from '@epam/ai-dial-ui-kit';
import { Image } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';
import { getSourcesTypes } from '@/src/utils/deployments/images';
import { EntitiesI18nKey, EntityFieldsI18nKey, ImagesI18nKey } from '@/src/constants/i18n';
import DeploymentStatusIndicator from '@/src/components/Common/DeploymentStatusIndicator/DeploymentStatusIndicator';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import ImageProperties from '@/src/components/Images/Properties/ImageProperties';

interface Props {
  image: Image;
  setImage: (server: Image) => void;
  route: ApplicationRoute;
  originalName: string;
}

const Properties: FC<Props> = ({ image, setImage, route, originalName }) => {
  const t = useI18n() as (stringToTranslate: string) => string;

  const sourcesList = getSourcesTypes(t);

  return (
    <div className="flex flex-col pt-3 w-full">
      <div className="flex gap-10 overflow-y-scroll">
        <DialLabelledText label={t(EntityFieldsI18nKey.id)} text={originalName} />
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
          <DeploymentStatusIndicator status={image.buildStatus} />
        </DialLabelledText>
      </div>
      <div className="mt-8 pt-8">
        <ImageProperties image={image} setImage={setImage} route={route} />
      </div>
    </div>
  );
};

export default Properties;
