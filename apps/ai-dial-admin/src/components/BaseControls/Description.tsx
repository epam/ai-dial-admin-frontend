import { useCallback, useMemo, useState } from 'react';

import { DialTextarea } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { getControlClassName } from '@/src/utils/entities/view';

interface Props<T> {
  entity: T;
  disabled?: boolean;
  isFullWidth?: boolean;
  onChangeEntity?: (entity: T) => void;
}

const DescriptionControl = <T extends { description?: string }>({
  entity,
  onChangeEntity,
  isFullWidth = true,
  disabled,
  ...props
}: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { dispatch } = useSaveValidationContext();
  const containerClassName = useMemo(() => getControlClassName(isFullWidth), [isFullWidth]);

  const [descriptionError, setDescriptionError] = useState<FieldError | null>(null);

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
      labelProps={{ label: t(EntityFieldsI18nKey.description) }}
      placeholder={t(EntityPlaceholdersI18nKey.Description)}
      value={entity.description}
      error={descriptionError?.text}
      invalid={descriptionError ? true : undefined}
      onChange={onChangeDescription}
      containerClassName={containerClassName}
      disabled={disabled || isReadOnlyAdmin}
      {...props}
    />
  );
};

export default DescriptionControl;
