'use client';

import { FC, useCallback, useState } from 'react';
import { uniq } from 'lodash';

import AutocompleteField from '@/src/components/Common/Dropdown/Autocomplete/AutocompleteField';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import TextAreaField from '@/src/components/Common/TextAreaField/TextAreaField';
import { CreateI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { MAX_NAME_SYMBOLS, MIN_NAME_SYMBOLS } from '@/src/constants/validation';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { FieldError } from '@/src/models/error';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { getErrorForName } from '@/src/utils/validation/name-error';

interface Props {
  entity: DialAdapter;
  names?: string[];
  isEntityImmutable?: boolean;
  onChangeAdapter: (adapter: DialAdapter) => void;
}

const AdapterProperties: FC<Props> = ({ entity, names, onChangeAdapter, isEntityImmutable }) => {
  const t = useI18n() as (t: string, props?: Record<string, number>) => string;
  const [isValidDisplayName, setIsValidDisplayName] = useState(true);
  const [nameError, setNameError] = useState<FieldError | null>(null);
  const [displayNameError, setDisplayNameError] = useState<string | undefined>(void 0);
  const [descriptionError, setDescriptionError] = useState<FieldError | null>(null);

  const onChangeName = useCallback(
    (name: string) => {
      const newEntity = { ...entity, name };
      setNameError(getErrorForName(name, names, t));
      onChangeAdapter(newEntity);
    },
    [entity, names, t, onChangeAdapter],
  );

  const onChangeDisplayName = useCallback(
    (displayName: string) => {
      const isValid = displayName
        ? displayName.length <= MAX_NAME_SYMBOLS && displayName.length >= MIN_NAME_SYMBOLS
        : true;
      setIsValidDisplayName(isValid);
      setDisplayNameError(
        isValid ? void 0 : t(CreateI18nKey.MinMaxLength, { min: MIN_NAME_SYMBOLS, max: MAX_NAME_SYMBOLS }),
      );
      onChangeAdapter({ ...entity, displayName });
    },
    [t, onChangeAdapter, entity],
  );

  const onChangeDescription = useCallback(
    (description: string) => {
      setDescriptionError(getErrorForDescription(description, t));
      onChangeAdapter({ ...entity, description });
    },
    [onChangeAdapter, entity, t],
  );

  const onChangeEndpoint = useCallback(
    (baseEndpoint: string) => {
      onChangeAdapter({ ...entity, baseEndpoint });
    },
    [onChangeAdapter, entity],
  );

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
        errorText={displayNameError}
        onChange={onChangeDisplayName}
        invalid={!isValidDisplayName}
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
        placeholder={t(EntitiesI18nKey.EndpointPlaceholder)}
        fieldTitle={t(EntitiesI18nKey.EndpointBase)}
        value={entity.baseEndpoint}
        onChange={onChangeEndpoint}
      />
    </div>
  );
};

export default AdapterProperties;
