import { FC, useMemo } from 'react';

import { getAppRunner } from '@/src/components/Applications/ParametersTab/utils';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IconControl from '@/src/components/BaseControls/Icon';
import IdControl from '@/src/components/BaseControls/Id/Id';
import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import TopicsControl from '@/src/components/BaseControls/Topics';
import VersionControl from '@/src/components/BaseControls/Version';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import Defaults from '@/src/components/Defaults/Defaults';
import { getAssetCreateFolderHandler } from '@/src/components/EntityListView/utils';
import EntityAttachments from '@/src/components/EntityMainProperties/EntityAttachments/EntityAttachments';
import SourceField from '@/src/components/SourceField/SourceField';
import { ASSET_APPLICATION_SOURCE_ITEMS } from '@/src/components/SourceField/constants';
import { getSchemaSourceId } from '@/src/utils/entities/application-source';
import { BasicI18nKey, EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { AssetApp, DeploymentAsset } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  asset: DeploymentAsset;
  runners?: DialApplicationScheme[];
  onChange: (asset: DeploymentAsset) => void;
  isPublication?: boolean;
}

const ApplicationAssetProperties: FC<Props> = ({ asset, runners, onChange, isPublication }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const assetApp = asset as AssetApp;

  const appRunner = useMemo(() => getAppRunner(assetApp, runners), [assetApp, runners]);

  const schemaSourceId = getSchemaSourceId(assetApp.source);
  const showResponsesDefaults =
    (!schemaSourceId && !!assetApp.responsesEndpoint) ||
    (!!schemaSourceId && !!appRunner?.['dial:applicationTypeResponsesEndpoint']);

  return (
    <div className="flex flex-col gap-y-8">
      {isPublication && (
        <IdControl entity={asset} onChangeEntity={onChange} checkEmptySymbols={false} isFullWidth={false} />
      )}
      <DisplayNameControl
        displayName={asset.displayName}
        required
        isFullWidth={false}
        onChange={(displayName) => onChange({ ...asset, displayName })}
      />
      {isPublication && (
        <VersionControl
          containerClassName="w-[175px]"
          version={asset.version}
          onChange={(version?: string) =>
            onChange?.({ ...asset, version: version || '', displayVersion: version || '' })
          }
        />
      )}
      <DescriptionControl entity={asset} onChangeEntity={onChange} isFullWidth={false} />

      <IconControl iconUrl={asset.iconUrl} onChange={(icon) => onChange({ ...asset, iconUrl: icon })} />
      <TopicsControl entity={asset} onChange={onChange} view={ApplicationRoute.AssetsApplications} />

      {!isPublication && (
        <FilePath
          value={asset.folderId}
          label={t(EntitiesI18nKey.FolderStorage)}
          modalTitle={t(BasicI18nKey.MoveToFolder)}
          placeholder={t(EntityPlaceholdersI18nKey.Path)}
          onChange={(folderId) => onChange?.({ ...asset, folderId })}
          context={useAppsFolder}
          disabled={isReadOnlyAdmin}
          onCreateFolder={getAssetCreateFolderHandler(ApplicationRoute.AssetsApplications)}
          view={ApplicationRoute.AssetsApplications}
        />
      )}

      <SourceField
        id="sourceType"
        view={ApplicationRoute.AssetsApplications}
        label={t(EntitiesI18nKey.SourceType)}
        sourceItems={ASSET_APPLICATION_SOURCE_ITEMS}
        entity={asset as AssetApp}
        onChange={onChange as (entity: DialApplication) => void}
        runners={runners}
        isEntityImmutable={true}
      />
      <EntityAttachments
        entity={asset as DialApplication}
        onChangeEntity={onChange as (entity: DialApplication) => void}
      />
      <Defaults
        values={(asset as DialApplication).defaults}
        onChangeValues={(defaults) => onChange({ ...asset, defaults } as DeploymentAsset)}
        title={t(EntityFieldsI18nKey.completionDefaults)}
      />
      {showResponsesDefaults && (
        <Defaults
          values={(asset as DialApplication).responsesDefaults}
          onChangeValues={(responsesDefaults) => onChange({ ...asset, responsesDefaults } as DeploymentAsset)}
          title={t(EntityFieldsI18nKey.responsesDefaults)}
          validationKey="responsesDefaultKeys"
        />
      )}
      <MaxRetryAttempts entity={asset} onChangeEntity={onChange} />
    </div>
  );
};

export default ApplicationAssetProperties;
