import { FC, useCallback, useMemo, useState } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import VersionControl from '@/src/components/BaseControls/Version';
import ApplicationSource from '@/src/components/SourceField/Application/ApplicationSource';
import ToolsetEndpoint from '@/src/components/SourceField/Endpoints/ToolsetEndpoint';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { getAssetVersionBusinessError } from '@/src/utils/deployments/validation';
import { isDeploymentAsset } from '@/src/utils/is-view';

interface Props {
  view?: ApplicationRoute;
  entity: AssetWithVersion;
  names: string[];
  isEntityImmutable?: boolean;
  versionsMap?: Record<string, string[]>;
  onChangeEntity: (entity: object) => void;
  runners?: DialApplicationScheme[];
  initialValues?: Partial<AssetWithVersion>;
  isModal?: boolean;
}

const AssetProperties: FC<Props> = ({
  view,
  entity,
  names,
  onChangeEntity,
  isEntityImmutable = false,
  versionsMap,
  runners,
  initialValues,
  isModal,
}) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const [versionError, setVersionError] = useState<string | undefined>(void 0);

  const isDeployment = useMemo(() => {
    return isDeploymentAsset(view);
  }, [view]);

  const validateVersion = useCallback(
    (version?: string) => {
      const err = getAssetVersionBusinessError(versionsMap, entity.name, t, version);
      setVersionError(err?.text);
      dispatch({ type: ValidationActionType.SetField, field: 'version', isValid: !err });
    },
    [dispatch, entity, t, versionsMap],
  );

  const onChangeVersion = useCallback(
    (version?: string) => {
      onChangeEntity({ ...entity, version } as DialPrompt);
      validateVersion(version);
    },
    [entity, onChangeEntity, validateVersion],
  );

  return (
    <div className="flex flex-col gap-y-8">
      {!isEntityImmutable && (
        <IdControl
          label={isDeployment ? t(EntityFieldsI18nKey.id) : t(EntityFieldsI18nKey.displayName)}
          placeholder={isDeployment ? t(EntityPlaceholdersI18nKey.Id) : t(EntityPlaceholdersI18nKey.DisplayName)}
          entity={entity}
          names={names}
          onChangeEntity={onChangeEntity}
          checkEmptySymbols={false}
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

      <VersionControl
        isFullWidth={!isEntityImmutable}
        version={entity.version}
        onChange={onChangeVersion}
        error={versionError}
      />

      <DescriptionControl entity={entity} onChangeEntity={onChangeEntity} />

      {view === ApplicationRoute.AssetsApplications && !isEntityImmutable && !initialValues && (
        <ApplicationSource
          view={view}
          entity={entity}
          runners={runners}
          isEntityImmutable={isEntityImmutable}
          onChangeEntity={onChangeEntity}
          isModal={isModal}
        />
      )}
      {view === ApplicationRoute.AssetsToolsets && !isEntityImmutable && (
        <ToolsetEndpoint isModal={isModal} entity={entity} onChange={onChangeEntity} />
      )}
    </div>
  );
};

export default AssetProperties;
