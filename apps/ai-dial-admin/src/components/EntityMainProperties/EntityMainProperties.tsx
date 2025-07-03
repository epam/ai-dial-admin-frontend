'use client';

import { uniq } from 'lodash';
import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { getModelsAdapters } from '@/src/app/[lang]/models/actions';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import AutocompleteField from '@/src/components/Common/Dropdown/Autocomplete/AutocompleteField';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import ReadonlyField from '@/src/components/Common/ReadonlyField/ReadonlyField';
import TextAreaField from '@/src/components/Common/TextAreaField/TextAreaField';
import { CreateI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { MAX_NAME_SYMBOLS } from '@/src/constants/validation';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { FieldError } from '@/src/models/error';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { getErrorForName } from '@/src/utils/validation/name-error';
import AdapterSelector from './AdapterSelector/AdapterSelector';
import { getDisplayNameErrorKeyPerView, getVersionErrorKeyPerView, isWrongLength } from './error-title';
import RunnerSelector from './RunnerSelector/RunnerSelector';

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
  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);

  const [adapters, setAdapters] = useState<DialAdapter[]>([]);
  const [isVersionOptional, setIsVersionOptional] = useState(true);

  const [nameError, setNameError] = useState<FieldError | null>(null);
  const [descriptionError, setDescriptionError] = useState<FieldError | null>(null);

  const [isValidDisplayName, setIsValidDisplayName] = useState(true);
  const [displayNameError, setDisplayNameError] = useState<string | undefined>(void 0);

  const [isValidVersion, setIsValidVersion] = useState(true);
  const [versionError, setVersionError] = useState<string | undefined>(void 0);

  const applicationRunner = runners?.find((runner) => runner.$id === (entity as DialApplication).customAppSchemaId);

  const isShowCompletionEndpoint = view === ApplicationRoute.Applications && !!applicationRunner;
  useEffect(() => {
    getModelsAdapters().then((res) => {
      if (res.success) {
        setAdapters((res.response as DialAdapter[]) || []);
      } else {
        showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [setAdapters]);

  useEffect(() => {
    if (isUniqueNameError) {
      setNameError(getErrorForName(void 0, void 0, t, true));
    }
  }, [isUniqueNameError, t]);

  const onChangeDeploymentId = useCallback(
    (deploymentId: string) => {
      const newEntity = { ...entity, name: deploymentId };
      setNameError(getErrorForName(deploymentId, void 0, t));
      onChangeEntity(newEntity);
    },
    [entity, onChangeEntity, t],
  );

  const onChangeDisplayName = useCallback(
    (name: string) => {
      const displayName = name.trim();
      const isIncludesDisplayName = names.includes(displayName);
      setIsVersionOptional(!isIncludesDisplayName);
      setIsValidDisplayName(
        (!isIncludesDisplayName || (isIncludesDisplayName && !!entity.displayVersion)) &&
          (view === ApplicationRoute.Applications || view === ApplicationRoute.Models
            ? displayName.length <= MAX_NAME_SYMBOLS
            : true),
      );
      onChangeEntity({ ...entity, displayName });
    },
    [names, entity, view, onChangeEntity],
  );

  useEffect(() => {
    const errorKey = getDisplayNameErrorKeyPerView(view, isWrongLength(view, entity.displayName));

    setDisplayNameError(isValidDisplayName ? void 0 : errorKey ? t(errorKey, { number: MAX_NAME_SYMBOLS }) : '');
  }, [entity.displayName, isValidDisplayName, t, view]);

  const onChangeVersion = useCallback(
    (displayVersion: string) => {
      onChangeEntity({ ...entity, displayVersion });
      if (!isVersionOptional && !isValidDisplayName && !!displayNameError) {
        setIsValidDisplayName(!!displayVersion);
      } else if (!isVersionOptional) {
        const errorKey = getVersionErrorKeyPerView(view);
        setVersionError(!displayVersion ? (errorKey ? t(errorKey) : '') : void 0);
      } else {
        const isLengthError = isWrongLength(view, displayVersion);
        setIsValidVersion(!isLengthError);
        setVersionError(isLengthError ? t(CreateI18nKey.ErrorLength) : '');
      }
    },
    [entity, onChangeEntity, displayNameError, t, view, isVersionOptional, isValidDisplayName, setIsValidDisplayName],
  );

  const onChangeAdapter = useCallback(
    (adapter: string) => {
      onChangeEntity({ ...entity, adapter });
    },
    [entity, onChangeEntity],
  );

  const onChangeEndpoint = useCallback(
    (endpoint: string) => {
      onChangeEntity({ ...entity, endpoint });
    },
    [entity, onChangeEntity],
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
      <TextInputField
        fieldTitle={t(CreateI18nKey.DeploymentIdTitle)}
        elementId="deploymentId"
        placeholder={t(CreateI18nKey.DeploymentIdPlaceholder)}
        value={entity.name}
        disabled={isEntityImmutable}
        onChange={onChangeDeploymentId}
        errorText={nameError?.text}
        invalid={!!nameError}
        iconAfterInput={isEntityImmutable && <CopyButton field={entity.name} title={t(CreateI18nKey.IdTitle)} />}
      />
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

      {view !== ApplicationRoute.Assistants && (
        <TextInputField
          elementId="displayVersion"
          fieldTitle={t(CreateI18nKey.VersionTitle)}
          placeholder={t(CreateI18nKey.VersionPlaceholder)}
          optional={isVersionOptional}
          value={entity.displayVersion}
          onChange={onChangeVersion}
          invalid={!isValidVersion}
          errorText={versionError}
        />
      )}

      {view === ApplicationRoute.Applications && (
        <RunnerSelector
          entity={entity}
          runners={runners}
          isEditEntityView={isEntityImmutable}
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

      {isShowCompletionEndpoint ? (
        isEntityImmutable && (
          <ReadonlyField
            value={applicationRunner['dial:applicationTypeCompletionEndpoint']}
            title={t(CreateI18nKey.CompletionEndpointTitle)}
          />
        )
      ) : view === ApplicationRoute.Models ? (
        <AdapterSelector adapters={adapters} onChangeAdapter={onChangeAdapter} model={entity} />
      ) : (
        view !== ApplicationRoute.Assistants && (
          <TextInputField
            elementId="adapter"
            fieldTitle={t(EntitiesI18nKey.Endpoint)}
            placeholder={t(EntitiesI18nKey.EndpointPlaceholder)}
            value={entity.endpoint}
            onChange={onChangeEndpoint}
          />
        )
      )}
    </div>
  );
};

export default EntityMainProperties;
