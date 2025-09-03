import { useCallback, useState } from 'react';

import TextAreaField from '@/src/components/Common/TextAreaField/TextAreaField';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props<T> {
  entity: T;
  readonly?: boolean;
  disabled?: boolean;
  onChangeEntity?: (entity: T) => void;
}

const DescriptionControl = <T extends { description?: string }>({ entity, onChangeEntity, ...props }: Props<T>) => {
  const t = useI18n() as (t: string) => string;
  const { dispatch } = useSaveValidationContext();

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
    <TextAreaField
      elementId="description"
      fieldTitle={t(EntityFieldsI18nKey.description)}
      placeholder={t(EntityPlaceholdersI18nKey.Description)}
      optional={true}
      value={entity.description}
      errorText={descriptionError?.text}
      invalid={!!descriptionError}
      onChange={onChangeDescription}
      elementCssClass="w-full"
      {...props}
    />
  );
};

export default DescriptionControl;
