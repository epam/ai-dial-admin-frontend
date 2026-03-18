import { FC, useCallback } from 'react';
import { DialRadioGroup, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';

import { Image } from '@/src/models/deployments/images';
import { ImagesI18nKey } from '@/src/constants/i18n';
import { IMAGE_BUILDER_TYPE } from '@/src/types/deployments/images';
import { BUILDER_TYPES } from '@/src/constants/deployments/images';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
}

const ImageBuildPrivileges: FC<Props> = ({ image, setImage }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const builderTypes = BUILDER_TYPES(t);

  const onChange = useCallback(
    (id: string) => {
      setImage({
        ...image,
        imageBuilder: id as IMAGE_BUILDER_TYPE,
      });
    },
    [image, setImage],
  );

  return (
    <DialRadioGroup
      fieldTitle={t(ImagesI18nKey.BuildPrivileges)}
      elementId="imageBuilder"
      radioButtons={builderTypes}
      onChange={onChange}
      activeRadioButton={image.imageBuilder || builderTypes[0].id}
      orientation={RadioGroupOrientation.Column}
      disabled={isReadOnlyAdmin}
    />
  );
};

export default ImageBuildPrivileges;
