import {
  DialFormPopup,
  DialRadioGroup,
  DialUploadFileItem,
  RadioButtonWithContent,
  RadioGroupOrientation,
} from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import semver from 'semver';

import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import VersionControl from '@/src/components/BaseControls/Version';
import FilePath from '@/src/components/Common/FilePath/FilePath';
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
import { ServerActionResponse } from '@/src/models/server-action';
import { DuplicationTypes } from '@/src/types/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { duplicateEntityMap, getClonedEntityName, getCloneTitle } from '@/src/utils/entities/duplicate-entity';
import { checkNameVersionCombination, getInitialVersion } from '@/src/utils/entities/versions';
import { isDeploymentAsset, isVersionlessAssetView } from '@/src/utils/is-view';
import { addTrailingSlash } from '@/src/utils/url';
import { DialApplicationResource, DialToolsetResource, ToolsetAuthType } from '@/src/models/dial/resource';

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
  versionsMap = {},
  context,
  onDuplicate,
  onClose,
  onCreateFolder,
}) => {
  const t = useI18n();
  const { isValid, dispatch } = useSaveValidationContext();
  // Prompts/conversations are versionless: new-entity duplication only — no "New Version"
  // radio, no version field, name seeded with the "copy" suffix.
  const isVersionless = isVersionlessAssetView(view);
  const initialName = entity.name;
  const initialFolder = entity._metadata?.folderId;
  const [duplicationType, setDuplicationType] = useState<string>(
    isVersionless ? DuplicationTypes.ENTITY : DuplicationTypes.VERSION,
  );

  const duplicationTypes: RadioButtonWithContent[] = [
    { id: DuplicationTypes.VERSION, name: t(EntitiesI18nKey.NewVersion) },
    { id: DuplicationTypes.ENTITY, name: t(EntitiesI18nKey.NewEntity, { entity: t(duplicateEntityMap[view]) }) },
  ];

  const [clonedAsset, setClonedAsset] = useState<AssetWithVersion | DialPrompt>(() =>
    isVersionless
      ? { ...entity, name: getClonedEntityName(entity.name) }
      : ({
          ...entity,
          name: duplicationType === DuplicationTypes.VERSION ? entity.name : getClonedEntityName(entity.name),
          display_name: isDeploymentAsset(view) ? (entity as DeploymentAsset).display_name : void 0,
          _metadata: {
            ...entity._metadata,
            version: getInitialVersion(versionsMap, entity?.name),
          },
        } as AssetWithVersion),
  );
  const [isInnerValid, setIsInnerValid] = useState(false);

  // `entity` is the row-shaped duplicate source; the `Dial*Resource` reads below only touch real
  // content fields (`auth_settings`, `external_services`), which that shape also carries — hence the
  // double casts once its flat identity stopped overlapping `DialResource`.
  const isToolsetWithAuth = useMemo(() => {
    const assetToolset = entity as unknown as DialToolsetResource;
    return (
      assetToolset.auth_settings?.authentication_type &&
      assetToolset.auth_settings.authentication_type !== ToolsetAuthType.NONE
    );
  }, [entity]);

  const authType = useMemo(() => {
    if (!isToolsetWithAuth) return null;
    return (entity as unknown as DialToolsetResource).auth_settings?.authentication_type || null;
  }, [isToolsetWithAuth, entity]);

  useEffect(() => {
    const name = clonedAsset.name;
    const version = clonedAsset?._metadata?.version;
    setIsInnerValid(
      isVersionless
        ? !!name
        : !!name &&
            !!version &&
            semver.valid(version) !== null &&
            !checkNameVersionCombination(versionsMap, name, version),
    );
  }, [clonedAsset, versionsMap, isVersionless]);

  // Initial validation for auth fields
  useEffect(() => {
    if (authType === ToolsetAuthType.OAUTH) {
      (clonedAsset as unknown as DialToolsetResource).auth_settings = {
        authentication_type: ToolsetAuthType.NONE,
      };
    } else if (authType === ToolsetAuthType.API_KEY) {
      const toolset = entity as unknown as DialToolsetResource;
      dispatch({
        type: ValidationActionType.SetField,
        field: 'authSettings.apiKeyHeader',
        isValid: !!toolset.auth_settings?.api_key_header,
      });
    }

    // Core never returns a real client_secret on read, so an OAuth external service copied
    // verbatim fails Core's write-time validation with a missing-CLIENT_SECRET error.
    const externalServices = (entity as unknown as DialApplicationResource).external_services;
    if (externalServices) {
      (clonedAsset as unknown as DialApplicationResource).external_services = Object.fromEntries(
        Object.entries(externalServices).map(([key, service]) => [
          key,
          service.auth_settings?.authentication_type === ToolsetAuthType.OAUTH
            ? { ...service, auth_settings: { authentication_type: ToolsetAuthType.NONE } }
            : service,
        ]),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeName = useCallback(
    (display_name?: string) => {
      setClonedAsset({ ...clonedAsset, display_name } as AssetWithVersion);
    },
    [setClonedAsset, clonedAsset],
  );

  const onChangeVersion = useCallback(
    (version?: string) => {
      setClonedAsset({
        ...clonedAsset,
        display_version: version,
        _metadata: {
          ...clonedAsset._metadata,
          version,
        },
      } as AssetWithVersion);
    },
    [setClonedAsset, clonedAsset],
  );

  const onChangePath = useCallback(
    (folderId: string) => {
      setClonedAsset({
        ...clonedAsset,
        _metadata: {
          ...clonedAsset._metadata,
          folderId,
        },
      } as AssetWithVersion);
    },
    [setClonedAsset, clonedAsset],
  );

  const onChangeDuplicationType = useCallback(
    (type: string) => {
      setDuplicationType(type);
      if (type === DuplicationTypes.VERSION) {
        setClonedAsset({
          ...clonedAsset,
          name: initialName,
          _metadata: {
            ...clonedAsset._metadata,
            version: getInitialVersion(versionsMap, initialName),
          },
        } as AssetWithVersion);
      } else {
        setClonedAsset({
          ...clonedAsset,
          name: entity.name === initialName ? getClonedEntityName(entity.name) : entity.name,
          _metadata: {
            folderId: initialFolder,
            version: DEFAULT_NEW_ENTITY_VERSION,
          },
        } as AssetWithVersion);
      }
    },
    [clonedAsset, initialName, initialFolder, entity.name, versionsMap],
  );

  const onChangeApiKeyHeader = useCallback(
    (api_key_header: string) => {
      const toolset = clonedAsset as unknown as DialToolsetResource;
      setClonedAsset({
        ...toolset,
        auth_settings: { ...toolset.auth_settings!, api_key_header },
      } as unknown as AssetWithVersion);
    },
    [clonedAsset],
  );

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(getCloneTitle(view, t))}
      portalId="DuplicateAsset"
      open={isModalOpen}
      onSubmit={() =>
        onDuplicate?.({
          ...clonedAsset,
          _metadata: {
            ...clonedAsset._metadata,
            folderId: addTrailingSlash(clonedAsset._metadata?.folderId),
          },
        } as AssetWithVersion)
      }
      onCancel={onClose}
      disableSubmitButton={!isInnerValid || !isValid}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Duplicate)}
    >
      <div className="flex flex-col px-6 py-4 gap-4">
        {!isVersionless && (
          <DialRadioGroup
            radioButtons={duplicationTypes}
            activeRadioButton={duplicationType}
            elementId="duplicationTypes"
            fieldTitle={t(EntitiesI18nKey.DuplicationType)}
            orientation={RadioGroupOrientation.Column}
            onChange={onChangeDuplicationType}
          />
        )}
        <IdControl
          entity={clonedAsset}
          onChangeEntity={setClonedAsset}
          disabled={!isVersionless && duplicationType === DuplicationTypes.VERSION}
          checkEmptySymbols={false}
        />
        {isDeploymentAsset(view) && (
          <DisplayNameControl
            displayName={(clonedAsset as DeploymentAsset).display_name}
            onChange={onChangeName}
            required
          />
        )}
        {!isVersionless && (
          <VersionControl version={(clonedAsset as AssetWithVersion)._metadata?.version} onChange={onChangeVersion} />
        )}

        {authType === ToolsetAuthType.API_KEY && <h3>{t(ToolsetI18nKey.ApiKey)}</h3>}

        {authType === ToolsetAuthType.API_KEY && (
          <ApiKeyHeaderControl
            apiKeyHeader={(clonedAsset as unknown as DialToolsetResource).auth_settings?.api_key_header}
            onChange={onChangeApiKeyHeader}
          />
        )}

        {duplicationType === DuplicationTypes.ENTITY && (
          <FilePath
            value={clonedAsset._metadata?.folderId}
            label={t(EntitiesI18nKey.FolderStorage)}
            modalTitle={t(BasicI18nKey.MoveToFolder)}
            placeholder={t(EntityPlaceholdersI18nKey.Path)}
            onChange={onChangePath}
            context={context}
            onCreateFolder={onCreateFolder}
            view={view}
          />
        )}
      </div>
    </DialFormPopup>
  );
};

export default DuplicateAsset;
