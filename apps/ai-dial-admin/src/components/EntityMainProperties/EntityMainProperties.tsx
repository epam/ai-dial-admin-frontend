'use client';

import { uniq } from 'lodash';
import { FC, useCallback, useEffect, useState } from 'react';

import ApplicationSource from '@/src/components/ApplicationSource/ApplicationSource';
import AutocompleteField from '@/src/components/Common/Dropdown/Autocomplete/AutocompleteField';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import TextAreaField from '@/src/components/Common/TextAreaField/TextAreaField';
import { CreateI18nKey } from '@/src/constants/i18n';
import { MAX_NAME_SYMBOLS, MIN_NAME_SYMBOLS } from '@/src/constants/validation';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { FieldError } from '@/src/models/error';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { getErrorForName, isWrongLengthWithView } from '@/src/utils/validation/name-error';
import AdditionalProperties from './AdditionalProperties';
import { getDisplayNameErrorKeyPerView, getVersionErrorKeyPerView } from './utils';
import { DialModel } from '@/src/models/dial/model';

interface Props {
  view: ApplicationRoute;
  entity: DialBaseEntity;
  names: string[];
  runners?: DialApplicationScheme[];
  isEntityImmutable?: boolean;
  isUniqueNameError?: boolean;
  onChangeEntity: (entity: DialBaseEntity) => void;
}

const EntityMainProperties: FC<Props> = ({
  view,
  entity,
  runners,
  names,
  isUniqueNameError,
  onChangeEntity,
  isEntityImmutable = false,
}) => {
  const t = useI18n() as (str: string, param?: Record<string, number>) => string;

  const [isVersionOptional, setIsVersionOptional] = useState(true);

  const [nameError, setNameError] = useState<FieldError | null>(null);
  const [descriptionError, setDescriptionError] = useState<FieldError | null>(null);

  const [isValidDisplayName, setIsValidDisplayName] = useState(true);
  const [displayNameError, setDisplayNameError] = useState<string | undefined>(void 0);

  const [isValidVersion, setIsValidVersion] = useState(true);
  const [versionError, setVersionError] = useState<string | undefined>(void 0);

  useEffect(() => {
    if (isUniqueNameError) {
      setNameError(getErrorForName(void 0, void 0, t, true));
    }
  }, [isUniqueNameError, t]);

  const onChangeName = useCallback(
    (name: string) => {
      const newEntity = { ...entity, name };
      if (view === ApplicationRoute.Models) {
        (newEntity as DialModel).endpointDeploymentName = name;
      }
      setNameError(getErrorForName(name, void 0, t));
      onChangeEntity(newEntity);
    },
    [entity, onChangeEntity, view, t],
  );

  const onChangeDisplayName = useCallback(
    (name: string) => {
      const displayName = name.trim();
      const isIncludesDisplayName = names.includes(displayName);
      setIsVersionOptional(!isIncludesDisplayName);
      setIsValidDisplayName(
        (!isIncludesDisplayName || (isIncludesDisplayName && !!(entity as DialModel).displayVersion)) &&
          !isWrongLengthWithView(view, displayName),
      );
      onChangeEntity({ ...entity, displayName });
    },
    [names, entity, view, onChangeEntity],
  );

  useEffect(() => {
    const errorKey = getDisplayNameErrorKeyPerView(view, isWrongLengthWithView(view, entity.displayName));

    setDisplayNameError(
      isValidDisplayName ? void 0 : errorKey ? t(errorKey, { min: MIN_NAME_SYMBOLS, max: MAX_NAME_SYMBOLS }) : '',
    );
  }, [entity.displayName, isValidDisplayName, t, view]);

  const onChangeVersion = useCallback(
    (displayVersion: string) => {
      onChangeEntity({ ...entity, displayVersion } as DialModel);
      if (!isVersionOptional && !isValidDisplayName && !!displayNameError) {
        setIsValidDisplayName(!!displayVersion);
      } else if (!isVersionOptional) {
        const errorKey = getVersionErrorKeyPerView(view);
        setVersionError(!displayVersion ? (errorKey ? t(errorKey) : '') : void 0);
      } else {
        const isLengthError = displayVersion != null ? isWrongLengthWithView(view, displayVersion) : false;
        setIsValidVersion(!isLengthError);
        setVersionError(
          isLengthError ? t(CreateI18nKey.MinMaxLength, { min: MIN_NAME_SYMBOLS, max: MAX_NAME_SYMBOLS }) : '',
        );
      }
    },
    [entity, onChangeEntity, displayNameError, t, view, isVersionOptional, isValidDisplayName, setIsValidDisplayName],
  );

  const onChangeDescription = useCallback(
    (description: string) => {
      setDescriptionError(getErrorForDescription(description, t));
      onChangeEntity({ ...entity, description });
    },
    [entity, onChangeEntity, t],
  );

  return (
    <div className="w-full flex flex-col gap-6">
      <div className='flex flex-col lg:w-[35%] gap-6'>
        {!isEntityImmutable && (
          <TextInputField
            fieldTitle={t(CreateI18nKey.IdTitle)}
            elementId="id"
            placeholder={t(CreateI18nKey.IdPlaceholder)}
            value={entity.name}
            onChange={onChangeName}
            errorText={nameError?.text}
            invalid={!!nameError}
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

        {view === ApplicationRoute.Models && (
          <TextInputField
            elementId="displayVersion"
            fieldTitle={t(CreateI18nKey.VersionTitle)}
            placeholder={t(CreateI18nKey.VersionPlaceholder)}
            optional={isVersionOptional}
            value={(entity as DialModel).displayVersion}
            onChange={onChangeVersion}
            invalid={!isValidVersion}
            errorText={versionError}
          />
        )}

        {view === ApplicationRoute.Applications && !isEntityImmutable && (
          <ApplicationSource
            entity={entity}
            runners={runners}
            isEntityImmutable={isEntityImmutable}
            onChangeEntity={onChangeEntity}
          />
        )}
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
      </div>

      <AdditionalProperties
        entity={entity}
        onChangeEntity={onChangeEntity}
        view={view}
        isEntityImmutable={isEntityImmutable}
        runners={runners}
      />
    </div>
  );
};

export default EntityMainProperties;
