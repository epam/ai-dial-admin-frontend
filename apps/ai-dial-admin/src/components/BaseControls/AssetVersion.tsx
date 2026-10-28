import { FC, useEffect, useId } from 'react';
import { Input } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { ResourceType } from '@/src/types/resource-type';
import { getControlClassName } from '@/src/utils/entities/view';
import { getAssetDestinationError, getAssetVersionError } from '@/src/utils/validation/asset-version';

interface Props {
  version?: string;
  name?: string;
  folderId?: string;
  resourceType: ResourceType;
  existingPaths?: string[];
  onChange?: (version?: string) => void;
  isFullWidth?: boolean;
  containerClassName?: string;
}

const AssetVersion: FC<Props> = ({
  version,
  name,
  folderId,
  resourceType,
  existingPaths,
  onChange,
  isFullWidth = true,
  containerClassName,
}) => {
  const t = useI18n();
  const id = useId();
  const validationField = `assetVersion-${id}`;
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const error =
    folderId && name
      ? getAssetDestinationError(folderId, name, version, resourceType, t, existingPaths)
      : getAssetVersionError(version, t);
  const hasError = !isReadOnlyAdmin && !!error;

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: validationField, isValid: !hasError });
  }, [dispatch, validationField, hasError, resetCounter]);

  useEffect(() => {
    return () => dispatch({ type: ValidationActionType.RemoveField, field: validationField });
  }, [dispatch, validationField]);

  return (
    <Input
      id={validationField}
      labelProps={{ label: t(EntityFieldsI18nKey.version), required: true }}
      placeholder={t(EntityPlaceholdersI18nKey.Version)}
      value={version}
      error={hasError ? error?.text : undefined}
      invalid={hasError}
      onChange={onChange}
      containerClassName={containerClassName || getControlClassName(isFullWidth)}
      disabled={isReadOnlyAdmin}
    />
  );
};

export default AssetVersion;
