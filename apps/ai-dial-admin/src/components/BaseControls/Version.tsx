import { DialInput } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { getControlClassName } from '@/src/utils/entities/view';
import {
  getSemanticVersionFormatError,
  SEMANTIC_VERSION_VALIDATION_FIELD,
} from '@/src/utils/deployments/validation';

interface Props {
  version?: string;
  optional?: boolean;
  disabled?: boolean;
  containerClassName?: string;
  className?: string;
  error?: string;
  hideError?: boolean;
  title?: string;
  isFullWidth?: boolean;
  enableSemanticValidation?: boolean;
  onChange?: (version?: string) => void;
}

const VersionControl: FC<Props> = ({
  isFullWidth = true,
  version,
  error,
  optional,
  hideError,
  onChange,
  title,
  disabled,
  enableSemanticValidation = true,
  containerClassName,
  ...props
}) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { dispatch } = useSaveValidationContext();
  const containerClass = useMemo(
    () => containerClassName || getControlClassName(isFullWidth),
    [containerClassName, isFullWidth],
  );

  const [formatError, setFormatError] = useState<FieldError | null>(null);

  const applySemanticValidation = useCallback(
    (value?: string) => {
      if (!enableSemanticValidation) {
        setFormatError(null);
        dispatch({
          type: ValidationActionType.SetField,
          field: SEMANTIC_VERSION_VALIDATION_FIELD,
          isValid: true,
        });
        return;
      }
      const err = getSemanticVersionFormatError(value, t);
      setFormatError(err);
      dispatch({
        type: ValidationActionType.SetField,
        field: SEMANTIC_VERSION_VALIDATION_FIELD,
        isValid: !err,
      });
    },
    [dispatch, enableSemanticValidation, t],
  );

  const onChangeVersion = useCallback(
    (value?: string) => {
      applySemanticValidation(value);
      onChange?.(value);
    },
    [applySemanticValidation, onChange],
  );

  useEffect(() => {
    applySemanticValidation(version);
  }, [version, applySemanticValidation]);

  useEffect(() => {
    return () => {
      dispatch({
        type: ValidationActionType.SetField,
        field: SEMANTIC_VERSION_VALIDATION_FIELD,
        isValid: true,
      });
    };
  }, [dispatch]);

  const showFormatError = !hideError && !!formatError;
  const mergedError = error || (showFormatError ? formatError?.text : undefined);

  return (
    <DialInput
      id="displayVersion"
      labelProps={{ label: title || t(EntityFieldsI18nKey.version), required: !optional }}
      placeholder={t(EntityPlaceholdersI18nKey.Version)}
      value={version}
      error={mergedError}
      invalid={!!error || showFormatError}
      onChange={onChangeVersion}
      containerClassName={containerClass}
      disabled={disabled || isReadOnlyAdmin}
      {...props}
    />
  );
};

export default VersionControl;
