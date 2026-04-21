'use client';

import { DialSelectField } from '@epam/ai-dial-ui-kit';
import { uniq } from 'lodash';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getModelsAdapters } from '@/src/app/[lang]/models/actions';
import { getMCPContainers, getModelContainers } from '@/src/app/actions/deployments';
import DescriptionControl from '@/src/components/BaseControls/Description';
import IdControl from '@/src/components/BaseControls/Id/Id';
import VersionControl from '@/src/components/BaseControls/Version';
import SourceField from '@/src/components/SourceField/SourceField';
import { APPLICATION_SOURCE_ITEMS, getSourceItems } from '@/src/components/SourceField/constants';
import { EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { ChatEntity } from '@/src/models/dial/base-entity';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import { getNamesConfigurations } from '@/src/utils/entities/filter-names';
import AdditionalProperties from './AdditionalProperties';
import { getDisplayNameError, getVersionError } from './utils';
import { isEntitiesWithDisplayVersion } from '@/src/utils/is-view';

interface Props {
  view: ApplicationRoute;
  entity: ChatEntity;
  names: string[];
  isUniqueNameError?: boolean;
  runners?: DialApplicationScheme[];
  isEntityImmutable?: boolean;
  onChangeEntity: (entity: ChatEntity) => void;
  initialValues?: Partial<ChatEntity>;
  isModal?: boolean;
}

const DeploymentProperties: FC<Props> = ({
  view,
  entity,
  runners,
  names,
  isUniqueNameError,
  onChangeEntity,
  isEntityImmutable = false,
  initialValues,
  isModal,
}) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { dispatch } = useSaveValidationContext();
  const { featureFlags } = useAppContext();
  const [displayNameError, setDisplayNameError] = useState<string | undefined>(void 0);

  const namesConfiguration = useMemo(() => {
    return getNamesConfigurations(names);
  }, [names]);

  const isVersionOptional = useMemo(() => {
    return !namesConfiguration.names.includes(entity.displayName as string);
  }, [entity.displayName, namesConfiguration.names]);

  const versionError = useMemo(() => {
    return getVersionError(isVersionOptional, entity as DialModel, namesConfiguration.versionsMap, t);
  }, [entity, isVersionOptional, namesConfiguration.versionsMap, t]);

  const onValidationDisplayName = useCallback(
    (displayName?: string) => {
      const error = getDisplayNameError(
        view,
        displayName || '',
        namesConfiguration.names,
        t,
        (entity as DialModel).displayVersion,
      );
      setDisplayNameError(error);

      dispatch({
        type: ValidationActionType.SetField,
        field: 'displayName',
        isValid: !error,
      });
    },
    [dispatch, entity, namesConfiguration.names, t, view],
  );

  const onChangeDisplayName = useCallback(
    (displayName: string) => {
      onChangeEntity({ ...entity, displayName });
      onValidationDisplayName(displayName);
    },
    [entity, onChangeEntity, onValidationDisplayName],
  );

  const onChangeVersion = useCallback(
    (displayVersion?: string) => {
      onChangeEntity({ ...entity, displayVersion } as DialModel);
      onValidationDisplayName(entity?.displayName);
    },
    [entity, onChangeEntity, onValidationDisplayName],
  );

  useEffect(() => {
    if (entity.displayName) {
      onValidationDisplayName(entity.displayName);
    } else {
      dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: false });
    }
  }, [dispatch, entity.displayName, onValidationDisplayName]);

  useEffect(() => {
    if (isEntitiesWithDisplayVersion(view)) {
      dispatch({ type: ValidationActionType.SetField, field: 'displayVersion', isValid: !versionError });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionError, (entity as DialModel).displayVersion, t, view, dispatch]);

  return (
    <div className="w-full flex flex-col gap-y-8">
      {!isEntityImmutable && (
        <IdControl
          entity={entity}
          names={names}
          onChangeEntity={onChangeEntity}
          isUniqueNameError={isUniqueNameError}
        />
      )}

      <DialSelectField
        id="displayName"
        label={t(EntityFieldsI18nKey.displayName)}
        placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
        inlineSearch
        required
        value={entity.displayName}
        customSelectedValue={entity.displayName}
        onChange={(value) => onChangeDisplayName(value as string)}
        error={displayNameError}
        options={uniq(namesConfiguration.names)
          .sort()
          .map((name) => ({ value: name, label: name }))}
        containerClassName={!isEntityImmutable ? 'w-full' : STANDARD_CONTROL_WIDTH}
        disabled={isReadOnlyAdmin}
      />
      {isEntitiesWithDisplayVersion(view) && (
        <VersionControl
          title={t(EntityFieldsI18nKey.displayVersion)}
          version={(entity as DialModel).displayVersion}
          onChange={onChangeVersion}
          error={versionError}
          optional={isVersionOptional}
          isFullWidth={!isEntityImmutable}
          hideError={!!displayNameError}
          enableSemanticValidation={false}
        />
      )}

      <DescriptionControl entity={entity} onChangeEntity={onChangeEntity} isFullWidth={!isEntityImmutable} />
      {view === ApplicationRoute.Applications && !isEntityImmutable && !initialValues && (
        <SourceField
          id="sourceType"
          view={view}
          label={t(EntitiesI18nKey.SourceType)}
          sourceItems={APPLICATION_SOURCE_ITEMS}
          entity={entity as DialApplication}
          onChange={onChangeEntity as (entity: DialApplication) => void}
          runners={runners}
          isEntityImmutable={isEntityImmutable}
          isModal={isModal}
        />
      )}

      <AdditionalProperties
        entity={entity}
        onChangeEntity={onChangeEntity}
        view={view}
        isEntityImmutable={isEntityImmutable}
        runners={runners}
      />

      {(view === ApplicationRoute.Models || view === ApplicationRoute.Toolsets) && !initialValues && (
        <SourceField
          view={view}
          entity={entity}
          id="sourceType"
          onChange={onChangeEntity}
          getContainers={view === ApplicationRoute.Models ? getModelContainers : getMCPContainers}
          label={t(EntitiesI18nKey.SourceType)}
          sourceItems={getSourceItems(view, featureFlags.deploymentsEnabled, featureFlags.mcpRegistryEnabled)}
          getAdapters={getModelsAdapters}
          isModal={!isEntityImmutable}
        />
      )}
    </div>
  );
};

export default DeploymentProperties;
