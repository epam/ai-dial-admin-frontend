import { FC } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IconControl from '@/src/components/BaseControls/Icon';
import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import TopicsControl from '@/src/components/BaseControls/Topics';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import Defaults from '@/src/components/Defaults/Defaults';
import EntityAttachments from '@/src/components/EntityMainProperties/EntityAttachments/EntityAttachments';
import ForwardAuthTokenField from '@/src/components/EntityMainProperties/ForwardAuthToken/ForwardAuthTokenField';
import ApplicationSource from '@/src/components/SourceField/Application/ApplicationSource';
import { BasicI18nKey, EntitiesI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DeploymentAsset } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  asset: DeploymentAsset;
  runners?: DialApplicationScheme[];
  onChange: (asset: DeploymentAsset) => void;
}

const ApplicationAssetProperties: FC<Props> = ({ asset, runners, onChange }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col gap-y-8">
      <DisplayNameControl
        displayName={asset.displayName}
        required
        isFullWidth={false}
        onChange={(displayName) => onChange({ ...asset, displayName })}
      />
      <DescriptionControl entity={asset} onChangeEntity={onChange} isFullWidth={false} />

      <IconControl iconUrl={asset.iconUrl} onChange={(icon) => onChange({ ...asset, iconUrl: icon })} />
      <TopicsControl entity={asset} onChange={onChange} view={ApplicationRoute.AssetsApplications} />

      <FilePath
        value={asset.folderId}
        label={t(EntitiesI18nKey.FolderStorage)}
        modalTitle={t(BasicI18nKey.MoveToFolder)}
        placeholder={t(EntityPlaceholdersI18nKey.Path)}
        onChange={(folderId) => onChange?.({ ...asset, folderId })}
        context={useAppsFolder}
      />

      <ApplicationSource
        entity={asset}
        onChangeEntity={onChange as (entity: DialApplication) => void}
        runners={runners}
        isEntityImmutable={true}
        view={ApplicationRoute.AssetsApplications}
      />
      <EntityAttachments
        entity={asset as DialApplication}
        onChangeEntity={onChange as (entity: DialApplication) => void}
      />
      <Defaults entity={asset as DialApplication} onChangeEntity={onChange as (entity: DialApplication) => void} />
      <ForwardAuthTokenField
        view={ApplicationRoute.AssetsApplications}
        entity={asset}
        onChangeEntity={onChange as (entity: DialApplication) => void}
      />
      <MaxRetryAttempts entity={asset} onChangeEntity={onChange} />
    </div>
  );
};

export default ApplicationAssetProperties;
