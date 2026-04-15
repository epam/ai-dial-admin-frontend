import {
  DialFormPopup,
  DialInput,
  DialPasswordInput,
  DialRadioGroup,
  RadioButtonWithContent,
  RadioGroupOrientation,
} from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import semver from 'semver';

import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import IdControl from '@/src/components/BaseControls/Id/Id';
import VersionControl from '@/src/components/BaseControls/Version';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import {
  BasicI18nKey,
  ButtonsI18nKey,
  EntitiesI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  ToolsetI18nKey,
} from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { AssetToolset, AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ToolsetAuthType } from '@/src/models/dial/toolset';
import { DuplicationTypes } from '@/src/types/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { duplicateEntityMap, getClonedEntityName, getCloneTitle } from '@/src/utils/entities/duplicate-entity';
import { isDeploymentAsset } from '@/src/utils/is-view';
import { checkNameVersionCombination, getInitialVersion } from '@/src/utils/prompts/versions';
import { addTrailingSlash } from '@/src/utils/url';

interface Props {
  view: ApplicationRoute;
  isModalOpen: boolean;
  entity: AssetWithVersion;
  versionsMap: Record<string, string[]>;
  context?: () => AssetsFolderContext;
  onClose: () => void;
  onDuplicate: (entity: AssetWithVersion) => void;
}

const DuplicateAsset: FC<Props> = ({ view, isModalOpen, entity, versionsMap, context, onDuplicate, onClose }) => {
  const t = useI18n();
  const { isValid, dispatch } = useSaveValidationContext();
  const initialName = entity.name;
  const initialFolder = entity.folderId;
  const [duplicationType, setDuplicationType] = useState<string>(DuplicationTypes.VERSION);

  const duplicationTypes: RadioButtonWithContent[] = [
    { id: DuplicationTypes.VERSION, name: t(EntitiesI18nKey.NewVersion) },
    { id: DuplicationTypes.ENTITY, name: t(EntitiesI18nKey.NewEntity, { entity: t(duplicateEntityMap[view]) }) },
  ];

  const [clonedAsset, setClonedAsset] = useState<AssetWithVersion>({
    ...entity,
    name: duplicationType === DuplicationTypes.VERSION ? entity.name : getClonedEntityName(entity.name),
    displayName: isDeploymentAsset(view) ? entity.displayName : void 0,
    version: getInitialVersion(versionsMap, entity?.name),
  });
  const [isInnerValid, setIsInnerValid] = useState(false);

  const isToolsetWithAuth = useMemo(() => {
    const assetToolset = entity as AssetToolset;
    return (
      'authSettings' in entity &&
      assetToolset.authSettings?.authenticationType &&
      assetToolset.authSettings.authenticationType !== ToolsetAuthType.NONE
    );
  }, [entity]);

  const authType = useMemo(() => {
    if (!isToolsetWithAuth) return null;
    return (entity as AssetToolset).authSettings?.authenticationType || null;
  }, [isToolsetWithAuth, entity]);

  useEffect(() => {
    setIsInnerValid(
      !!clonedAsset.name &&
        !!clonedAsset.version &&
        semver.valid(clonedAsset.version) !== null &&
        !checkNameVersionCombination(versionsMap, clonedAsset.name, clonedAsset.version),
    );
  }, [clonedAsset, versionsMap]);

  // Initial validation for auth fields
  useEffect(() => {
    if (authType === ToolsetAuthType.OAUTH) {
      const toolset = entity as AssetToolset;
      dispatch({ type: ValidationActionType.SetField, field: 'clientId', isValid: !!toolset.authSettings?.clientId });
      dispatch({
        type: ValidationActionType.SetField,
        field: 'clientSecret',
        isValid: !!toolset.authSettings?.clientSecret,
      });
      dispatch({
        type: ValidationActionType.SetField,
        field: 'authorizationEndpoint',
        isValid: !!toolset.authSettings?.authorizationEndpoint,
      });
    } else if (authType === ToolsetAuthType.API_KEY) {
      const toolset = entity as AssetToolset;
      dispatch({
        type: ValidationActionType.SetField,
        field: 'apiKeyHeader',
        isValid: !!toolset.authSettings?.apiKeyHeader,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeName = useCallback(
    (displayName?: string) => {
      setClonedAsset({ ...clonedAsset, displayName });
    },
    [setClonedAsset, clonedAsset],
  );

  const onChangeVersion = useCallback(
    (version?: string) => {
      setClonedAsset({ ...clonedAsset, version: version || '' });
    },
    [setClonedAsset, clonedAsset],
  );

  const onChangePath = useCallback(
    (folderId: string) => {
      setClonedAsset({ ...clonedAsset, folderId });
    },
    [setClonedAsset, clonedAsset],
  );

  const onChangeDuplicationType = useCallback(
    (type: string) => {
      setDuplicationType(type);
      if (type === DuplicationTypes.VERSION) {
        setClonedAsset({ ...clonedAsset, name: initialName });
      } else {
        setClonedAsset({
          ...clonedAsset,
          folderId: initialFolder,
          name: entity.name === initialName ? getClonedEntityName(entity.name) : entity.name,
        });
      }
    },
    [clonedAsset, initialName, initialFolder, entity.name],
  );

  const onChangeClientId = useCallback(
    (clientId?: string) => {
      const toolset = clonedAsset as AssetToolset;
      setClonedAsset({
        ...toolset,
        authSettings: { ...toolset.authSettings!, clientId },
      });
      dispatch({ type: ValidationActionType.SetField, field: 'clientId', isValid: !!clientId });
    },
    [clonedAsset, dispatch],
  );

  const onChangeClientSecret = useCallback(
    (clientSecret?: string) => {
      const toolset = clonedAsset as AssetToolset;
      setClonedAsset({
        ...toolset,
        authSettings: { ...toolset.authSettings!, clientSecret },
      });
      dispatch({ type: ValidationActionType.SetField, field: 'clientSecret', isValid: !!clientSecret });
    },
    [clonedAsset, dispatch],
  );

  const onChangeAuthorizationEndpoint = useCallback(
    (authorizationEndpoint?: string) => {
      const toolset = clonedAsset as AssetToolset;
      setClonedAsset({
        ...toolset,
        authSettings: { ...toolset.authSettings!, authorizationEndpoint },
      });
      dispatch({
        type: ValidationActionType.SetField,
        field: 'authorizationEndpoint',
        isValid: !!authorizationEndpoint,
      });
    },
    [clonedAsset, dispatch],
  );

  const onChangeApiKeyHeader = useCallback(
    (apiKeyHeader?: string) => {
      const toolset = clonedAsset as AssetToolset;
      setClonedAsset({
        ...toolset,
        authSettings: { ...toolset.authSettings!, apiKeyHeader },
      });
      dispatch({ type: ValidationActionType.SetField, field: 'apiKeyHeader', isValid: !!apiKeyHeader });
    },
    [clonedAsset, dispatch],
  );

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(getCloneTitle(view, t))}
      portalId="DuplicateAsset"
      open={isModalOpen}
      onSubmit={() => onDuplicate({ ...clonedAsset, folderId: addTrailingSlash(clonedAsset.folderId) })}
      onCancel={onClose}
      disableSubmitButton={!isInnerValid || !isValid}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Duplicate)}
    >
      <div className="flex flex-col px-6 py-4 gap-4">
        <DialRadioGroup
          radioButtons={duplicationTypes}
          activeRadioButton={duplicationType}
          elementId="duplicationTypes"
          fieldTitle={t(EntitiesI18nKey.DuplicationType)}
          orientation={RadioGroupOrientation.Column}
          onChange={onChangeDuplicationType}
        />
        <IdControl
          entity={clonedAsset}
          onChangeEntity={setClonedAsset}
          disabled={duplicationType === DuplicationTypes.VERSION}
          checkEmptySymbols={false}
        />
        {isDeploymentAsset(view) && (
          <DisplayNameControl displayName={clonedAsset.displayName} onChange={onChangeName} required />
        )}
        <VersionControl version={clonedAsset.version} onChange={onChangeVersion} />

        {isToolsetWithAuth && (
          <h3>
            {authType === ToolsetAuthType.OAUTH && t(ToolsetI18nKey.OAuth)}
            {authType === ToolsetAuthType.API_KEY && t(ToolsetI18nKey.ApiKey)}
          </h3>
        )}

        {authType === ToolsetAuthType.OAUTH && (
          <>
            <DialInput
              id="clientId"
              labelProps={{ label: t(EntityFieldsI18nKey.clientId), required: true }}
              value={(clonedAsset as AssetToolset).authSettings?.clientId || ''}
              placeholder={t(EntityPlaceholdersI18nKey.ClientId)}
              onChange={onChangeClientId}
            />
            <DialPasswordInput
              id="clientSecret"
              labelProps={{ label: t(EntityFieldsI18nKey.clientSecret), required: true }}
              value={(clonedAsset as AssetToolset).authSettings?.clientSecret || ''}
              placeholder={t(EntityPlaceholdersI18nKey.ClientSecret)}
              onChange={onChangeClientSecret}
            />
            <EndpointControl
              id="authorizationEndpoint"
              required
              isFullWidth
              label={t(EntityFieldsI18nKey.authorizationEndpoint)}
              endpoint={(clonedAsset as AssetToolset).authSettings?.authorizationEndpoint || ''}
              placeholder={t(EntityPlaceholdersI18nKey.AuthorizationEndpoint)}
              onChange={onChangeAuthorizationEndpoint}
            />
          </>
        )}

        {authType === ToolsetAuthType.API_KEY && (
          <DialInput
            id="apiKeyHeader"
            labelProps={{ label: t(EntityFieldsI18nKey.apiKeyHeader), required: true }}
            placeholder={t(EntityPlaceholdersI18nKey.Header)}
            value={(clonedAsset as AssetToolset).authSettings?.apiKeyHeader || ''}
            onChange={onChangeApiKeyHeader}
          />
        )}

        {duplicationType === DuplicationTypes.ENTITY && (
          <FilePath
            value={clonedAsset.folderId}
            label={t(EntitiesI18nKey.FolderStorage)}
            modalTitle={t(BasicI18nKey.MoveToFolder)}
            placeholder={t(EntityPlaceholdersI18nKey.Path)}
            onChange={onChangePath}
            context={context}
          />
        )}
      </div>
    </DialFormPopup>
  );
};

export default DuplicateAsset;
