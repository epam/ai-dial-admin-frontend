'use client';

import { uniq } from 'lodash';
import { FC, useCallback, useEffect, useState } from 'react';

import ApplicationSource from '@/src/components/ApplicationSource/ApplicationSource';
import AutocompleteField from '@/src/components/Common/Dropdown/Autocomplete/AutocompleteField';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { FieldError } from '@/src/models/error';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorForName, isWrongLengthWithView } from '@/src/utils/validation/name-error';
import AdditionalProperties from './AdditionalProperties';
import { getDisplayNameError, getVersionError } from './utils';
import { DialModel } from '@/src/models/dial/model';
import classNames from 'classnames';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import VersionControl from './BaseProperties/Version';

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
  const { dispatch } = useSaveValidationContext();

  const [isVersionOptional, setIsVersionOptional] = useState(true);

  const [nameError, setNameError] = useState<FieldError | null>(null);

  const [isValidDisplayName, setIsValidDisplayName] = useState(true);
  const [displayNameError, setDisplayNameError] = useState<string | undefined>(void 0);

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
    const error = getDisplayNameError(view, isValidDisplayName, entity.displayName as string, t);
    setDisplayNameError(error);
    dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !error });
    validateVersion(entity.version);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity.displayName, isValidDisplayName, t, view]);

  const validateVersion = useCallback(
    (displayVersion?: string) => {
      const error = getVersionError(view, isVersionOptional, displayVersion as string, t);
      setVersionError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'displayVersion', isValid: !error });
    },
    [dispatch, isVersionOptional, t, view],
  );

  const onChangeVersion = useCallback(
    (displayVersion: string) => {
      onChangeEntity({ ...entity, displayVersion } as DialModel);
      if (!isVersionOptional && !isValidDisplayName && !!displayNameError) {
        setIsValidDisplayName(!!displayVersion);
      } else {
        validateVersion(displayVersion);
      }
    },
    [onChangeEntity, entity, isVersionOptional, isValidDisplayName, displayNameError, validateVersion],
  );

  return (
    <div className="w-full flex flex-col">
      <div className={classNames('flex flex-col gap-6', isEntityImmutable ? 'lg:w-[35%]' : 'w-full')}>
        {!isEntityImmutable && (
          <TextInputField
            elementId="id"
            placeholder={t(EntityPlaceholdersI18nKey.Id)}
            fieldTitle={t(EntityFieldsI18nKey.id)}
            value={entity.name}
            onChange={onChangeName}
            errorText={nameError?.text}
            invalid={!!nameError}
          />
        )}
        <AutocompleteField
          elementId="displayName"
          fieldTitle={t(EntityFieldsI18nKey.displayName)}
          placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
          value={entity.displayName}
          errorText={displayNameError}
          onChange={onChangeDisplayName}
          invalid={!isValidDisplayName}
          items={uniq(names)}
        />

        {view === ApplicationRoute.Models && (
          <VersionControl
            version={(entity as DialModel).displayVersion}
            onChange={onChangeVersion}
            error={versionError}
            optional={isVersionOptional}
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

        <DescriptionControl entity={entity} onChangeEntity={onChangeEntity} />
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
