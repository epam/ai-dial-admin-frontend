import { FC } from 'react';
import { DialRadioGroup, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';
import { Image } from '@/src/models/deployments/images';
import { useI18n } from '@/src/locales/client';
import { TRANSPORT_TYPES } from '@/src/constants/deployments/images';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { IMAGE_TRANSPORT_TYPE } from '@/src/types/deployments/images';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
}

const TransportField: FC<Props> = ({ image, setImage }) => {
  const t = useI18n();

  return (
    <DialRadioGroup
      fieldTitle={t(EntityFieldsI18nKey.TransportType)}
      elementId={'transport'}
      radioButtons={TRANSPORT_TYPES}
      onChange={(id) =>
        setImage({
          ...image,
          transportType: id as IMAGE_TRANSPORT_TYPE,
        })
      }
      activeRadioButton={image.transportType || TRANSPORT_TYPES[0].id}
      orientation={RadioGroupOrientation.Column}
    />
  );
};

export default TransportField;
