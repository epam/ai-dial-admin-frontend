import { FC, useCallback } from 'react';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Image } from '@/src/models/deployments/images';
import { useI18n } from '@/src/locales/client';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
}

const BaseDirectoryField: FC<Props> = ({ image, setImage }) => {
  const t = useI18n();

  const onChange = useCallback(
    (baseDirectory?: string) => {
      setImage({
        ...image,
        source: {
          ...image.source,
          baseDirectory,
        },
      });
    },
    [image, setImage],
  );

  return (
    <DialTextInputField
      fieldTitle={t(EntityFieldsI18nKey.BaseDirectory)}
      elementId="baseDirectory"
      placeholder={t(EntityPlaceholdersI18nKey.BaseDirectory)}
      value={image.source.baseDirectory}
      disabled={false}
      optional={true}
      containerClassName={STANDARD_CONTROL_WIDTH}
      onChange={onChange}
    />
  );
};

export default BaseDirectoryField;
