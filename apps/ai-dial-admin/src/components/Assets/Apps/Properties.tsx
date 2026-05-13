import { FC, useCallback, useMemo } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IconControl from '@/src/components/BaseControls/Icon';
import IdControl from '@/src/components/BaseControls/Id/Id';
import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import TopicsControl from '@/src/components/BaseControls/Topics';
import VersionControl from '@/src/components/BaseControls/Version';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import Defaults from '@/src/components/Defaults/Defaults';
import EntityAttachments from '@/src/components/EntityMainProperties/EntityAttachments/EntityAttachments';
import ForwardAuthTokenField from '@/src/components/EntityMainProperties/ForwardAuthToken/ForwardAuthTokenField';
import { getAppRunner } from '@/src/components/Applications/ParametersTab/utils';
import ApplicationSource from '@/src/components/SourceField/Application/ApplicationSource';
import { BasicI18nKey, EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { AssetApp, DeploymentAsset } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import { DialUploadFileItem } from '@epam/ai-dial-ui-kit';
import { CreateAssetActionMap, getEmptyAsset } from '@/src/components/Assets/BaseAssetList/utils';

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

  const showResponsesDefaults =
    (!assetApp.applicationTypeSchemaId && !!assetApp.responsesEndpoint) ||
    (!!assetApp.applicationTypeSchemaId && !!appRunner?.['dial:applicationTypeResponsesEndpoint']);

  const handleCreateFolder = useCallback(async (_: DialUploadFileItem | undefined, folderPath: string) => {
    const newPath = `${folderPath.replaceAll('//', '/')}/`;
    const emptyAsset = getEmptyAsset(ApplicationRoute.AssetsApplications, newPath);

    const createAsset = CreateAssetActionMap[ApplicationRoute.AssetsApplications];

    return createAsset(emptyAsset);
  }, []);

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
          onCreateFolder={handleCreateFolder}
          view={ApplicationRoute.AssetsApplications}
        />
      )}

      <ApplicationSource
        entity={asset as AssetApp}
        onChangeEntity={onChange as (entity: DialApplication) => void}
        runners={runners}
        isEntityImmutable={true}
      />
      <EntityAttachments
        entity={asset as DialApplication}
        onChangeEntity={onChange as (entity: DialApplication) => void}
      />
      <Defaults
        entity={asset as DialApplication}
        onChangeEntity={onChange as (entity: DialApplication) => void}
        title={t(EntityFieldsI18nKey.completionDefaults)}
      />
      {showResponsesDefaults && (
        <Defaults
          entity={asset as DialApplication}
          onChangeEntity={onChange as (entity: DialApplication) => void}
          title={t(EntityFieldsI18nKey.responsesDefaults)}
          valuesKey="responsesDefaults"
          tempKey="responsesDefaultsTemp"
          validationKey="responsesDefaultKeys"
        />
      )}
      <ForwardAuthTokenField
        view={ApplicationRoute.AssetsApplications}
        entity={asset}
        onChangeEntity={onChange as (entity: DialApplication) => void}
        disabled
      />
      <MaxRetryAttempts entity={asset} onChangeEntity={onChange} />
    </div>
  );
};

export default ApplicationAssetProperties;
