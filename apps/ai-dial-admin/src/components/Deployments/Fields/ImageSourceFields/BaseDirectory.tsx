import { FC, useCallback, useEffect, useState } from 'react';
import { DialInput } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Image } from '@/src/models/deployments/images';
import { useI18n } from '@/src/locales/client';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { FieldError } from '@/src/models/error';
import { getBaseDirectoryError } from '@/src/utils/deployments/validation';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
}

const BaseDirectory: FC<Props> = ({ image, setImage }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [error, setError] = useState<FieldError | null>(null);

  const onChange = useCallback(
    (baseDirectory?: string) => {
      const error = getBaseDirectoryError(baseDirectory, t);
      setError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'baseDirectory',
        isValid: !error,
      });
      setImage({
        ...image,
        source: {
          ...image.source,
          baseDirectory,
        },
      });
    },
    [dispatch, image, setImage, t],
  );

  useEffect(() => {
    if (resetCounter || (image.source.baseDirectory != null && image.source.baseDirectory.length > 0)) {
      const error = getBaseDirectoryError(image.source.baseDirectory, t);
      setError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'baseDirectory',
        isValid: !error,
      });
    }
  }, [dispatch, image.source.baseDirectory, resetCounter, t]);

  return (
    <DialInput
      labelProps={{ label: t(EntityFieldsI18nKey.BaseDirectory) }}
      id="baseDirectory"
      placeholder={t(EntityPlaceholdersI18nKey.BaseDirectory)}
      value={image.source.baseDirectory}
      disabled={false}
      containerClassName={STANDARD_CONTROL_WIDTH}
      onChange={onChange}
      invalid={!!error}
      error={error?.text}
    />
  );
};

export default BaseDirectory;
