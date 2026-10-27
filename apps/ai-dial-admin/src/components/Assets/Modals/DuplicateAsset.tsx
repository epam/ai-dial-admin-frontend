import { DialUploadFileItem } from '@epam/ai-dial-react-file-manager';
import { Popup } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import AssetVersion from '@/src/components/BaseControls/AssetVersion';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import ApiKeyHeaderControl from '@/src/components/Toolsets/Auth/Controls/ApiKeyHeaderControl';
import { DEFAULT_NEW_ENTITY_VERSION } from '@/src/constants/dial-base-entity';
import {
  BasicI18nKey,
  ButtonsI18nKey,
  EntitiesI18nKey,
  EntityPlaceholdersI18nKey,
  ToolsetI18nKey,
} from '@/src/constants/i18n';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { AssetWithVersion, DeploymentAsset } from '@/src/models/dial/deployment-asset';
import { DialPrompt } from '@/src/models/dial/prompt';
import { DialApplicationResource, DialToolsetResource, ToolsetAuthType } from '@/src/models/dial/resource';
import { ServerActionResponse } from '@/src/models/server-action';
import { ResourceType } from '@/src/types/resource-type';
import { ApplicationRoute } from '@/src/types/routes';
import { getClonedEntityName, getCloneTitle } from '@/src/utils/entities/duplicate-entity';
import { isDeploymentAsset, isVersionlessAssetView } from '@/src/utils/is-view';
import { addTrailingSlash } from '@/src/utils/url';
import { getAssetDestinationError, getAssetPathsFromVersions } from '@/src/utils/validation/asset-version';

interface Props {
  view: ApplicationRoute;
  isModalOpen: boolean;
  entity: AssetWithVersion | DialPrompt;
  versionsMap?: Record<string, string[]>;
  context?: () => AssetsFolderContextReader<AssetListItem>;
  onClose: () => void;
  onDuplicate?: (entity: AssetWithVersion | DialPrompt) => void;
  onCreateFolder?: (_: DialUploadFileItem | undefined, folderPath: string) => Promise<ServerActionResponse>;
}

const DuplicateAsset: FC<Props> = ({
  view,
  isModalOpen,
  entity,
  versionsMap,
  context,
  onDuplicate,
  onClose,
  onCreateFolder,
}) => {
  const t = useI18n();
  const { isValid, dispatch } = useSaveValidationContext();
  const folderContext = context?.();
  const fetchFiles = folderContext?.fetchFiles;
  const isVersionless = isVersionlessAssetView(view);
  const initialFolder = entity.folderId || entity._metadata?.folderId || 'public/';
  const [clonedAsset, setClonedAsset] = useState<AssetWithVersion | DialPrompt>(() => {
    const clone = { ...entity, name: getClonedEntityName(entity.name), folderId: initialFolder };
    if (isVersionless) return clone;
    const version =
      (entity as AssetWithVersion)._metadata?.version ||
      (entity as AssetWithVersion).version ||
      DEFAULT_NEW_ENTITY_VERSION;
    return {
      ...clone,
      version,
      display_version: version,
      _metadata: { ...entity._metadata, folderId: initialFolder, version },
    } as AssetWithVersion;
  });
  const folderId = clonedAsset.folderId || clonedAsset._metadata?.folderId || initialFolder;
  const destinationItems = folderContext?.fetchedFoldersData?.[folderId];
  const isLoadingDestination = !isVersionless && !!folderContext && destinationItems == null;
  const existingPaths = useMemo(
    () =>
      destinationItems?.map((item) => item.path) ||
      getAssetPathsFromVersions(folderId, folderId === initialFolder ? versionsMap : undefined),
    [destinationItems, folderId, initialFolder, versionsMap],
  );
  const version = (clonedAsset as AssetWithVersion)._metadata?.version;
  const versionError = !isVersionless
    ? getAssetDestinationError(
        folderId,
        clonedAsset.name || '',
        version,
        view === ApplicationRoute.AssetsToolsets ? ResourceType.TOOLSET : ResourceType.APPLICATION,
        t,
        existingPaths,
      )
    : null;

  useEffect(() => {
    if (isLoadingDestination) fetchFiles?.(folderId);
  }, [isLoadingDestination, fetchFiles, folderId]);

  const isToolsetWithAuth = useMemo(() => {
    const toolset = entity as unknown as DialToolsetResource;
    return (
      toolset.auth_settings?.authentication_type && toolset.auth_settings.authentication_type !== ToolsetAuthType.NONE
    );
  }, [entity]);
  const authType = isToolsetWithAuth
    ? (entity as unknown as DialToolsetResource).auth_settings?.authentication_type
    : null;

  useEffect(() => {
    if (authType === ToolsetAuthType.API_KEY) {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'authSettings.apiKeyHeader',
        isValid: !!(entity as unknown as DialToolsetResource).auth_settings?.api_key_header,
      });
    }
    setClonedAsset((previous) => {
      const cloned = previous as unknown as DialApplicationResource & DialToolsetResource;
      const externalServices = cloned.external_services;
      return {
        ...previous,
        ...(authType === ToolsetAuthType.OAUTH && { auth_settings: { authentication_type: ToolsetAuthType.NONE } }),
        ...(externalServices && {
          external_services: Object.fromEntries(
            Object.entries(externalServices).map(([key, service]) => [
              key,
              service.auth_settings?.authentication_type === ToolsetAuthType.OAUTH
                ? { ...service, auth_settings: { authentication_type: ToolsetAuthType.NONE } }
                : service,
            ]),
          ),
        }),
      };
    });
  }, [authType, dispatch, entity]);

  const onChangeVersion = useCallback((version?: string) => {
    setClonedAsset(
      (previous) =>
        ({
          ...previous,
          version,
          display_version: version,
          _metadata: { ...previous._metadata, version },
        }) as AssetWithVersion,
    );
  }, []);

  const onChangePath = useCallback((folderId: string) => {
    setClonedAsset(
      (previous) => ({ ...previous, folderId, _metadata: { ...previous._metadata, folderId } }) as AssetWithVersion,
    );
  }, []);

  const onChangeApiKeyHeader = useCallback((api_key_header: string) => {
    setClonedAsset((previous) => {
      const toolset = previous as unknown as DialToolsetResource;
      return {
        ...previous,
        auth_settings: { ...toolset.auth_settings, api_key_header },
      } as unknown as AssetWithVersion;
    });
  }, []);

  const onSubmit = () => {
    if (isLoadingDestination || versionError || !clonedAsset.name || !isValid) return;
    onDuplicate?.({
      ...clonedAsset,
      folderId: addTrailingSlash(folderId),
      ...(!isVersionless && { version, display_version: version }),
      _metadata: { ...clonedAsset._metadata, folderId: addTrailingSlash(folderId) },
    } as AssetWithVersion);
  };

  return (
    <Popup
      onClose={onClose}
      header={t(getCloneTitle(view, t))}
      portalId="DuplicateAsset"
      open={isModalOpen}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Duplicate),
        isSubmitDisabled: isLoadingDestination || !!versionError || !clonedAsset.name || !isValid,
        onCancel: onClose,
        onSubmit,
      })}
    >
      <div className="flex flex-col px-6 py-4 gap-4">
        <IdControl entity={clonedAsset} onChangeEntity={setClonedAsset} checkEmptySymbols={false} />
        {isDeploymentAsset(view) && (
          <DisplayNameControl
            displayName={(clonedAsset as DeploymentAsset).display_name}
            onChange={(display_name) => setClonedAsset({ ...clonedAsset, display_name } as AssetWithVersion)}
            required
          />
        )}
        {!isVersionless && (
          <AssetVersion
            version={version}
            name={clonedAsset.name}
            folderId={folderId}
            resourceType={view === ApplicationRoute.AssetsToolsets ? ResourceType.TOOLSET : ResourceType.APPLICATION}
            existingPaths={existingPaths}
            onChange={onChangeVersion}
          />
        )}
        {authType === ToolsetAuthType.API_KEY && <h3>{t(ToolsetI18nKey.ApiKey)}</h3>}
        {authType === ToolsetAuthType.API_KEY && (
          <ApiKeyHeaderControl
            apiKeyHeader={(clonedAsset as unknown as DialToolsetResource).auth_settings?.api_key_header}
            onChange={onChangeApiKeyHeader}
          />
        )}
        <FilePath
          value={folderId}
          label={t(EntitiesI18nKey.FolderStorage)}
          modalTitle={t(BasicI18nKey.MoveToFolder)}
          placeholder={t(EntityPlaceholdersI18nKey.Path)}
          onChange={onChangePath}
          context={context}
          onCreateFolder={onCreateFolder}
          view={view}
        />
      </div>
    </Popup>
  );
};

export default DuplicateAsset;
