'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { uniq } from 'lodash';

import AutocompleteField from '@/src/components/Common/Dropdown/Autocomplete/AutocompleteField';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import TextAreaField from '@/src/components/Common/TextAreaField/TextAreaField';
import { CreateI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { FieldError } from '@/src/models/error';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { getErrorForDisplayName, getErrorForName } from '@/src/utils/validation/name-error';
import { getUrlError } from '@/src/utils/validation/url-error';

interface Props {
  entity: DialAdapter;
  names?: string[];
  isEntityImmutable?: boolean;
  onChangeAdapter: (adapter: DialAdapter) => void;
}

const AdapterProperties: FC<Props> = ({ entity, names, onChangeAdapter, isEntityImmutable }) => {
  const t = useI18n() as (t: string, props?: Record<string, number>) => string;
  const { dispatch } = useSaveValidationContext();

  const [nameError, setNameError] = useState<FieldError | null>(null);
  const [displayNameError, setDisplayNameError] = useState<FieldError | null>(null);
  const [descriptionError, setDescriptionError] = useState<FieldError | null>(null);
  const [baseEndpointError, setBaseEndpointError] = useState<FieldError | null>(null);

  const validateDisplayName = useCallback(
    (displayName?: string) => {
      const error = getErrorForDisplayName(displayName, t);
      setDisplayNameError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !error });
    },
    [dispatch, t],
  );
  useEffect(() => {
    if (isEntityImmutable) {
      validateDisplayName(entity.displayName);
    }
  }, [entity.displayName, isEntityImmutable, validateDisplayName]);

  const validateEndpoint = useCallback(
    (endpoint?: string) => {
      const error = getUrlError(endpoint, true, t);
      setBaseEndpointError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'baseEndpoint', isValid: !error });
    },
    [dispatch, t],
  );
  useEffect(() => {
    if (isEntityImmutable) {
      validateEndpoint(entity.baseEndpoint);
    }
  }, [entity.baseEndpoint, isEntityImmutable, validateEndpoint]);

  const onChangeName = useCallback(
    (name: string) => {
      const newEntity = { ...entity, name };
      const error = getErrorForName(name, names, t);
      setNameError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !error });
      onChangeAdapter(newEntity);
    },
    [entity, names, t, onChangeAdapter, dispatch],
  );

  const onChangeDisplayName = useCallback(
    (displayName: string) => {
      if (!isEntityImmutable) {
        validateDisplayName(displayName);
      }
      onChangeAdapter({ ...entity, displayName });
    },
    [isEntityImmutable, onChangeAdapter, entity, validateDisplayName],
  );

  const onChangeDescription = useCallback(
    (description: string) => {
      const error = getErrorForDescription(description, t);
      setDescriptionError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'description', isValid: !error });
      onChangeAdapter({ ...entity, description });
    },
    [onChangeAdapter, entity, t, dispatch],
  );

  const onChangeEndpoint = useCallback(
    (baseEndpoint: string) => {
      if (!isEntityImmutable) {
        validateEndpoint(baseEndpoint);
      }
      onChangeAdapter({ ...entity, baseEndpoint });
    },
    [isEntityImmutable, onChangeAdapter, entity, validateEndpoint],
  );

  // initial validation on creation adapter (disable save when no values entered yet)
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!entity.name });
    dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !!entity.displayName });
    dispatch({ type: ValidationActionType.SetField, field: 'baseEndpoint', isValid: !!entity.baseEndpoint });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full flex flex-col gap-6">
      {!isEntityImmutable && (
        <TextInputField
          elementId="name"
          fieldTitle={t(CreateI18nKey.IdTitle)}
          placeholder={t(CreateI18nKey.IdPlaceholder)}
          value={entity.name}
          errorText={nameError?.text}
          invalid={!!nameError}
          onChange={onChangeName}
        />
      )}

      <AutocompleteField
        elementId="displayName"
        fieldTitle={t(CreateI18nKey.DisplayNameTitle)}
        placeholder={t(CreateI18nKey.DisplayNamePlaceholder)}
        value={entity.displayName}
        errorText={displayNameError?.text}
        onChange={onChangeDisplayName}
        invalid={!!displayNameError}
        items={uniq(names)}
      />

      <TextAreaField
        elementId="description"
        fieldTitle={t(CreateI18nKey.DescriptionTitle)}
        placeholder={t(CreateI18nKey.DescriptionPlaceholder)}
        optional={true}
        value={entity.description}
        errorText={descriptionError?.text}
        invalid={!!descriptionError}
        onChange={onChangeDescription}
        elementCssClass="w-full"
      />

      <TextInputField
        elementId="endpoint"
        placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
        fieldTitle={t(EntityFieldsI18nKey.baseEndpoint)}
        value={entity.baseEndpoint}
        onChange={onChangeEndpoint}
        errorText={baseEndpointError?.text}
        invalid={!!baseEndpointError}
      />
    </div>
  );
};

export default AdapterProperties;
