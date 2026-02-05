import { FC } from 'react';

import { DialSwitch } from '@epam/ai-dial-ui-kit';

import FilePath from '@/src/components/Common/FilePath/FilePath';
import Defaults from '@/src/components/Defaults/Defaults';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IconControl from '@/src/components/BaseControls/Icon';
import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import TopicsControl from '@/src/components/BaseControls/Topics';
import EntityAttachments from '@/src/components/EntityMainProperties/EntityAttachments/EntityAttachments';
import ForwardAuthTokenField from '@/src/components/EntityMainProperties/ForwardAuthToken/ForwardAuthTokenField';
import ApplicationSource from '@/src/components/SourceField/Application/ApplicationSource';
import ToolsetEndpoint from '@/src/components/SourceField/Endpoints/ToolsetEndpoint';
import Authentication from '@/src/components/Toolsets/Auth/Authentication';
import { BasicI18nKey, EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { AssetApp, AssetToolset, DeploymentAsset } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { Toolset, ToolsetAuthType } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  view: ApplicationRoute;
  asset: DeploymentAsset;
  runners: DialApplicationScheme[];
  onChange: (asset: DeploymentAsset) => void;
}

const DeploymentProperties: FC<Props> = ({ asset, view, runners, onChange }) => {
  const t = useI18n();

  return (
    <div className="h-full flex flex-col w-full gap-y-8">
      <div className="flex flex-col gap-y-8">
        <DisplayNameControl
          displayName={asset.displayName}
          required={true}
          isFullWidth={false}
          onChange={(displayName) => onChange({ ...asset, displayName })}
        />
        <DescriptionControl entity={asset} onChangeEntity={onChange} isFullWidth={false} />

        <IconControl iconUrl={asset.iconUrl} onChange={(icon) => onChange({ ...asset, iconUrl: icon })} />
        <TopicsControl entity={asset} onChange={onChange} view={view} />

        <FilePath
          value={asset.folderId}
          label={t(EntitiesI18nKey.FolderStorage)}
          modalTitle={t(BasicI18nKey.MoveToFolder)}
          placeholder={t(EntityPlaceholdersI18nKey.Path)}
          onChange={(folderId) => onChange?.({ ...asset, folderId })}
          context={
            view === ApplicationRoute.AssetsApplications
              ? (useAppsFolder as () => AssetsFolderContext<AssetApp | DialFile>)
              : (useToolsetFolder as () => AssetsFolderContext<AssetToolset | DialFile>)
          }
        />
        {view === ApplicationRoute.AssetsToolsets && (
          <>
            <ToolsetEndpoint entity={asset as AssetToolset} onChange={onChange as (entity: Toolset) => void} />
            <Authentication
              toolset={asset as AssetToolset}
              view={ApplicationRoute.AssetsToolsets}
              onChange={onChange as (entity: Toolset) => void}
            />
            <DialSwitch
              isOn={(asset as AssetToolset).forwardPerRequestKey}
              label={t(EntityFieldsI18nKey.forwardPerRequestKey)}
              switchId="forwardPerRequestKey"
              disabled={(asset as AssetToolset).authSettings?.authenticationType === ToolsetAuthType.API_KEY}
              onChange={(value: boolean) => {
                onChange({ ...asset, forwardPerRequestKey: value });
              }}
            />
          </>
        )}
        {view === ApplicationRoute.AssetsApplications && (
          <>
            <ApplicationSource
              entity={asset}
              onChangeEntity={onChange as (entity: DialApplication) => void}
              runners={runners}
              isEntityImmutable={true}
              view={view}
            />
            <EntityAttachments
              entity={asset as DialApplication}
              onChangeEntity={onChange as (entity: DialApplication) => void}
            />
            <Defaults
              entity={asset as DialApplication}
              onChangeEntity={onChange as (entity: DialApplication) => void}
            />
            <ForwardAuthTokenField
              view={view}
              entity={asset}
              onChangeEntity={onChange as (entity: DialApplication) => void}
            />
          </>
        )}
        <MaxRetryAttempts entity={asset} onChangeEntity={onChange} />
      </div>
    </div>
  );
};

export default DeploymentProperties;
