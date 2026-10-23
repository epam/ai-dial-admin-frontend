import { FC } from 'react';
import { RadioGroup, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';
import { toRadioItems } from '@/src/utils/radio-items';

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
    <RadioGroup
      labelProps={{ label: t(EntityFieldsI18nKey.TransportType) }}
      id="transport"
      items={toRadioItems(imageTransports)}
      onChange={(id) =>
        setImage({
          ...image,
          transportType: id as IMAGE_TRANSPORT_TYPE,
        })
      }
      value={image.transportType || imageTransports[0].id}
      orientation={RadioGroupOrientation.Column}
      disabled={isReadOnlyAdmin}
    />
  );
};

export default ImageTransport;
