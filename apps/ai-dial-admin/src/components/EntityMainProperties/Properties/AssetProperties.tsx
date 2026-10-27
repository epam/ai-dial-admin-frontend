import { FC, useCallback, useMemo } from 'react';

import AssetVersion from '@/src/components/BaseControls/AssetVersion';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import ToolsetEndpoint from '@/src/components/SourceField/Endpoints/ToolsetEndpoint';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ResourceType } from '@/src/types/resource-type';
import { ApplicationRoute } from '@/src/types/routes';
import { isDeploymentAsset, isVersionlessAssetView } from '@/src/utils/is-view';
import { getAssetPathsFromVersions } from '@/src/utils/validation/asset-version';

interface Props {
  view?: ApplicationRoute;
  entity: AssetWithVersion;
  names: string[];
  isEntityImmutable?: boolean;
  versionsMap?: Record<string, string[]>;
  onChangeEntity: (entity: object) => void;
  isModal?: boolean;
  hideVersionField?: boolean;
  isUniqueNameError?: boolean;
}

const AssetProperties: FC<Props> = ({
  view,
  entity,
  names,
  onChangeEntity,
  isEntityImmutable = false,
  versionsMap,
  isModal,
  hideVersionField,
  isUniqueNameError,
}) => {
  const t = useI18n();
  const isDeployment = isDeploymentAsset(view);
  const isVersionShown = !hideVersionField && !isVersionlessAssetView(view);
  const folderId = entity.folderId || entity._metadata?.folderId || 'public/';
  const existingPaths = useMemo(() => getAssetPathsFromVersions(folderId, versionsMap), [folderId, versionsMap]);

  const onChangeVersion = useCallback(
    (version?: string) => onChangeEntity({ ...entity, version, display_version: version }),
    [entity, onChangeEntity],
  );

  return (
    <div className="flex flex-col gap-y-8">
      {!isEntityImmutable && (
        <IdControl
          label={isDeployment ? t(EntityFieldsI18nKey.id) : t(EntityFieldsI18nKey.displayName)}
          placeholder={isDeployment ? t(EntityPlaceholdersI18nKey.Id) : t(EntityPlaceholdersI18nKey.DisplayName)}
          entity={entity}
          names={isVersionShown ? undefined : names}
          onChangeEntity={onChangeEntity}
          checkEmptySymbols={false}
          isUniqueNameError={isUniqueNameError}
        />
      )}

      {isDeployment && (
        <DisplayNameControl
          displayName={entity.displayName}
          required
          isFullWidth={!isEntityImmutable}
          onChange={(displayName) => onChangeEntity({ ...entity, displayName })}
        />
      )}

      {isVersionShown && (
        <AssetVersion
          isFullWidth={!isEntityImmutable}
          version={entity.version}
          name={entity.name}
          folderId={folderId}
          resourceType={view === ApplicationRoute.AssetsToolsets ? ResourceType.TOOLSET : ResourceType.APPLICATION}
          existingPaths={existingPaths}
          onChange={onChangeVersion}
        />
      )}

      <DescriptionControl entity={entity} onChangeEntity={onChangeEntity} />

      {view === ApplicationRoute.AssetsToolsets && !isEntityImmutable && (
        <ToolsetEndpoint isModal={isModal} entity={entity} onChange={onChangeEntity} isAsset />
      )}
    </div>
  );
};

export default AssetProperties;
