import { FC, useCallback, useState } from 'react';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

import { IMAGE_SOURCE_TYPE } from '@/src/types/deployments/images';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Image } from '@/src/models/deployments/images';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getDeploymentsURIError, getDeploymentsURLError } from '@/src/utils/deployments/validation';
import { useI18n } from '@/src/locales/client';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
}

const SourceAddressField: FC<Props> = ({ image, setImage }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const [sourceError, setSourceError] = useState<FieldError | null>(null);

  const onURLChange = useCallback(
    (url?: string) => {
      const error = getDeploymentsURLError(url as string, t);
      setSourceError(error);

      dispatch({
        type: ValidationActionType.SetField,
        field: 'sourceURL',
        isValid: !error,
      });
      setImage({
        ...image,
        source: {
          ...image.source,
          url,
        },
      });
    },
    [dispatch, image, setImage, t],
  );

  const onURIChange = useCallback(
    (imageUri?: string) => {
      const error = getDeploymentsURIError(imageUri as string, t);
      setSourceError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'sourceURI',
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

  return (
    <div className="flex w-full">
      {image.source?.$type === IMAGE_SOURCE_TYPE.CODE && (
        <DialTextInputField
          fieldTitle={t(EntityFieldsI18nKey.SourceURL)}
          elementId="sourceURL"
          placeholder={t(EntityPlaceholdersI18nKey.URL)}
          value={image.source.url}
          errorText={sourceError?.text}
          invalid={!!sourceError}
          onChange={onURLChange}
        />
      )}
      {image.source?.$type === IMAGE_SOURCE_TYPE.DOCKER && (
        <DialTextInputField
          fieldTitle={t(EntityFieldsI18nKey.ImageURI)}
          elementId="sourceURI"
          placeholder={t(EntityPlaceholdersI18nKey.URI)}
          value={image.source.imageUri}
          errorText={sourceError?.text}
          invalid={!!sourceError}
          onChange={onURIChange}
        />
      )}
    </div>
  );
};

export default SourceAddressField;
