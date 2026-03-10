import { DialInput } from '@epam/ai-dial-ui-kit';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getControlClassName } from '@/src/utils/entities/view';
import { getErrorForName, getErrorForUrlId } from '@/src/utils/validation/name-error';

interface Props<T> {
  entity: T;
  label?: string;
  placeholder?: string;
  names?: string[];
  isUrlId?: boolean;
  isUniqueNameError?: boolean;
  isDeploymentId?: boolean;
  disabled?: boolean;
  onChangeEntity?: (entity: T) => void;
  checkEmptySymbols?: boolean;
  isFullWidth?: boolean;
}

const IdControl = <T extends { name?: string }>({
  label,
  placeholder,
  entity,
  names,
  isUrlId,
  isUniqueNameError,
  isDeploymentId,
  disabled,
  onChangeEntity,
  checkEmptySymbols,
  isFullWidth = true,
}: Props<T>) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const [nameError, setNameError] = useState<FieldError | null>(null);
  const containerClassName = useMemo(() => getControlClassName(isFullWidth), [isFullWidth]);

  const validateName = useCallback(
    (name?: string) => {
      const error = isUrlId
        ? getErrorForUrlId(name, names, t)
        : getErrorForName(name, names, t, isUniqueNameError, true, false, isDeploymentId, checkEmptySymbols);
      setNameError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !error });
    },
    [dispatch, isDeploymentId, isUniqueNameError, isUrlId, names, t, checkEmptySymbols],
  );

  const onChangeName = useCallback(
    (name?: string) => {
      onChangeEntity?.({ ...entity, name: name?.trimStart() });
      validateName(name);
    },
    [entity, onChangeEntity, validateName],
  );

  useEffect(() => {
    if (entity.name) {
      validateName(entity.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUniqueNameError]);

  return (
    <DialInput
      placeholder={placeholder || t(EntityPlaceholdersI18nKey.Id)}
      labelProps={{ label: label || t(EntityFieldsI18nKey.id), required: true }}
      id="name"
      value={entity.name}
      onChange={onChangeName}
      error={nameError?.text}
      invalid={!!nameError}
      disabled={disabled}
      containerClassName={containerClassName}
    />
  );
};

export default IdControl;
