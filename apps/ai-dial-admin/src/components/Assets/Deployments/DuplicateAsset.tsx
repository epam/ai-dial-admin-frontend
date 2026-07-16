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
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { AssetWithVersion, DeploymentAsset } from '@/src/models/dial/deployment-asset';
import { ServerActionResponse } from '@/src/models/server-action';
import { DuplicationTypes } from '@/src/types/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { duplicateEntityMap, getClonedEntityName, getCloneTitle } from '@/src/utils/entities/duplicate-entity';
import { checkNameVersionCombination, getInitialVersion } from '@/src/utils/entities/versions';
import { isDeploymentAsset } from '@/src/utils/is-view';
import { addTrailingSlash } from '@/src/utils/url';
import { DialToolsetResource, ToolsetAuthType } from '@/src/models/dial/resource';

interface Props {
  view: ApplicationRoute;
  isModalOpen: boolean;
  entity: AssetWithVersion;
  versionsMap?: Record<string, string[]>;
  context?: () => AssetsFolderContext;
  onClose: () => void;
  onDuplicate?: (entity: AssetWithVersion) => void;
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
    display_name: isDeploymentAsset(view) ? (entity as DeploymentAsset).display_name : void 0,
    version: getInitialVersion(versionsMap, entity?.name),
  });
  const [isInnerValid, setIsInnerValid] = useState(false);

  const isToolsetWithAuth = useMemo(() => {
    const assetToolset = entity as DialToolsetResource;
    return (
      assetToolset.auth_settings?.authentication_type &&
      assetToolset.auth_settings.authentication_type !== ToolsetAuthType.NONE
    );
  }, [entity]);

  const authType = useMemo(() => {
    if (!isToolsetWithAuth) return null;
    return (entity as DialToolsetResource).auth_settings?.authentication_type || null;
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
      (clonedAsset as DialToolsetResource).auth_settings = {
        authentication_type: ToolsetAuthType.NONE,
      };
    } else if (authType === ToolsetAuthType.API_KEY) {
      const toolset = entity as DialToolsetResource;
      dispatch({
        type: ValidationActionType.SetField,
        field: 'authSettings.apiKeyHeader',
        isValid: !!toolset.auth_settings?.api_key_header,
      });
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
        setClonedAsset({
          ...clonedAsset,
          name: initialName,
          version: getInitialVersion(versionsMap, initialName),
        });
      } else {
        setClonedAsset({
          ...clonedAsset,
          folderId: initialFolder,
          name: entity.name === initialName ? getClonedEntityName(entity.name) : entity.name,
          version: DEFAULT_NEW_ENTITY_VERSION,
        });
      }
    },
    [clonedAsset, initialName, initialFolder, entity.name, versionsMap],
  );

  const onChangeApiKeyHeader = useCallback(
    (api_key_header: string) => {
      const toolset = clonedAsset as DialToolsetResource;
      setClonedAsset({
        ...toolset,
        auth_settings: { ...toolset.auth_settings!, api_key_header },
      } as AssetWithVersion);
    },
    [clonedAsset],
  );

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(getCloneTitle(view, t))}
      portalId="DuplicateAsset"
      open={isModalOpen}
      onSubmit={() => onDuplicate?.({ ...clonedAsset, folderId: addTrailingSlash(clonedAsset.folderId) })}
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
          <DisplayNameControl
            displayName={(clonedAsset as DeploymentAsset).display_name}
            onChange={onChangeName}
            required
          />
        )}
        <VersionControl version={clonedAsset.version} onChange={onChangeVersion} />

        {authType === ToolsetAuthType.API_KEY && <h3>{t(ToolsetI18nKey.ApiKey)}</h3>}

        {authType === ToolsetAuthType.API_KEY && (
          <ApiKeyHeaderControl
            apiKeyHeader={(clonedAsset as DialToolsetResource).auth_settings?.api_key_header}
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
            onCreateFolder={onCreateFolder}
            view={view}
          />
        )}
      </div>
    </DialFormPopup>
  );
};

export default DuplicateAsset;
