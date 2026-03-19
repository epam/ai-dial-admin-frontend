import { FC } from 'react';
import { DialRadioGroup, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';

import { Image } from '@/src/models/deployments/images';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { IMAGE_TRANSPORT_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import { TRANSPORT_TYPES } from '@/src/constants/deployments/images';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
}

const ImageTransport: FC<Props> = ({ image, setImage }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const imageTransports = TRANSPORT_TYPES(t);

  if (image.$type !== IMAGE_TYPE.MCP) {
    return null;
  }

  return (
    <DialRadioGroup
      fieldTitle={t(EntityFieldsI18nKey.TransportType)}
      elementId="transport"
      radioButtons={imageTransports}
      onChange={(id) =>
        setImage({
          ...image,
          transportType: id as IMAGE_TRANSPORT_TYPE,
        })
      }
      activeRadioButton={image.transportType || imageTransports[0].id}
      orientation={RadioGroupOrientation.Column}
      disabled={isReadOnlyAdmin}
    />
  );
};

export default ImageTransport;
