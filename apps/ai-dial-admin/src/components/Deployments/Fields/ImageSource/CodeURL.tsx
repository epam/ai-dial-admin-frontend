import { FC, useCallback, useEffect, useState } from 'react';
import { DialInput } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Image } from '@/src/models/deployments/images';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getDeploymentsURLError } from '@/src/utils/deployments/validation';
import { useI18n } from '@/src/locales/client';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
}

const CodeUrl: FC<Props> = ({ image, setImage }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [sourceError, setSourceError] = useState<FieldError | null>(null);

  const onURLChange = useCallback(
    (url?: string) => {
      const error = getDeploymentsURLError(url as string, t);
      setSourceError(error);

      dispatch({
        type: ValidationActionType.SetField,
        field: 'codeURL',
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

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'codeURL',
      isValid: !!image.source.url,
    });
  }, [dispatch, image.source.url]);

  useEffect(() => {
    if (resetCounter || (image.source.url != null && image.source.url.length > 0)) {
      const error = getDeploymentsURLError(image.source.url as string, t);
      setSourceError(error);

      dispatch({
        type: ValidationActionType.SetField,
        field: 'codeURL',
        isValid: !error,
      });
    }
  }, [dispatch, image.source.url, resetCounter, t]);

  useEffect(() => {
    return () => {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'codeURL',
        isValid: true,
      });
    };
  }, [dispatch]);

  return (
    <DialInput
      labelProps={{ title: t(EntityFieldsI18nKey.SourceURL) }}
      id="codeURL"
      placeholder={t(EntityPlaceholdersI18nKey.URL)}
      value={image.source.url}
      errorText={sourceError?.text}
      invalid={!!sourceError}
      onChange={onURLChange}
    />
  );
};

export default CodeUrl;
