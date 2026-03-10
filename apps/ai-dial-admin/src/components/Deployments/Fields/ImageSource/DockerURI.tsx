import { FC, useCallback, useEffect, useState } from 'react';
import { DialInput } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { FieldError } from '@/src/models/error';
import { Image } from '@/src/models/deployments/images';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getDeploymentsURIError } from '@/src/utils/deployments/validation';
import { useI18n } from '@/src/locales/client';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
}

const DockerURI: FC<Props> = ({ image, setImage }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [sourceError, setSourceError] = useState<FieldError | null>(null);

  const onURIChange = useCallback(
    (imageUri?: string) => {
      const error = getDeploymentsURIError(imageUri as string, t);
      setSourceError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'DockerURI',
        isValid: !error,
      });
      setImage({
        ...image,
        source: {
          ...image.source,
          imageUri,
        },
      });
    },
    [dispatch, image, setImage, t],
  );

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'DockerURI',
      isValid: !!image.source.imageUri,
    });
  }, [dispatch, image.source.imageUri]);

  useEffect(() => {
    if (resetCounter || (image.source.imageUri != null && image.source.imageUri?.length > 0)) {
      const error = getDeploymentsURIError(image.source.imageUri as string, t);
      setSourceError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'DockerURI',
        isValid: !error,
      });
    }
  }, [dispatch, image.source.imageUri, resetCounter, t]);

  useEffect(() => {
    return () => {
      setSourceError(null);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'DockerURI',
        isValid: true,
      });
    };
  }, [dispatch]);

  return (
    <DialInput
      labelProps={{ label: t(EntityFieldsI18nKey.ImageURI), required: true }}
      id="DockerURI"
      placeholder={t(EntityPlaceholdersI18nKey.URI)}
      value={image.source.imageUri}
      error={sourceError?.text}
      invalid={!!sourceError}
      onChange={onURIChange}
    />
  );
};

export default DockerURI;
