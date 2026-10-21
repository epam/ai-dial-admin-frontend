import { useCallback, useMemo, useState } from 'react';

import { DialTextarea } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { LocalizedText } from '@/src/models/dial/localized';
import { FieldError } from '@/src/models/error';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { isLocalizedMap, resolveLocalizedText } from '@/src/utils/entities/localized-value';
import { getControlClassName } from '@/src/utils/entities/view';

interface Props<T> {
  entity: T;
  disabled?: boolean;
  isFullWidth?: boolean;
  required?: boolean;
  onChangeEntity?: (entity: T) => void;
}

/** See `DisplayNameControl` for why a locale map is read-only here. */
const DescriptionControl = <T extends { description?: LocalizedText }>({
  entity,
  onChangeEntity,
  isFullWidth = true,
  disabled,
  required,
  ...props
}: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { dispatch } = useSaveValidationContext();
  const containerClassName = useMemo(() => getControlClassName(isFullWidth), [isFullWidth]);

  const [descriptionError, setDescriptionError] = useState<FieldError | null>(null);
  const isMap = isLocalizedMap(entity.description);

  const onChangeDescription = useCallback(
    (description: string) => {
      const error = getErrorForDescription(description, t);
      setDescriptionError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'description', isValid: !error });
      onChangeEntity?.({ ...entity, description });
    },
    [dispatch, entity, onChangeEntity, t],
  );

  return (
    <DialTextarea
      id="description"
      labelProps={{ label: t(EntityFieldsI18nKey.description), required }}
      placeholder={t(EntityPlaceholdersI18nKey.Description)}
      value={resolveLocalizedText(entity.description)}
      error={descriptionError?.text}
      invalid={descriptionError ? true : undefined}
      onChange={onChangeDescription}
      containerClassName={containerClassName}
      disabled={disabled || isReadOnlyAdmin || isMap}
      {...props}
    />
  );
};

export default DescriptionControl;
