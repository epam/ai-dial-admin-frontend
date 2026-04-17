import { FC, useCallback, useEffect, useState } from 'react';
import { DialInput } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Image } from '@/src/models/deployments/images';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getDeploymentsURLError } from '@/src/utils/deployments/validation';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
  disabled?: boolean;
}

const CodeUrl: FC<Props> = ({ image, setImage, disabled }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
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
      labelProps={{ label: t(EntityFieldsI18nKey.SourceURL), required: true }}
      id="codeURL"
      placeholder={t(EntityPlaceholdersI18nKey.URL)}
      value={image.source.url}
      error={sourceError?.text}
      invalid={!!sourceError}
      onChange={onURLChange}
      disabled={isReadOnlyAdmin || disabled}
    />
  );
};

export default CodeUrl;
