import { FC, useMemo } from 'react';

import classNames from 'classnames';

import { getAppRunner } from '@/src/components/Applications/ParametersTab/utils';
import FoldersStorageLabel from '@/src/components/Assets/Header/FolderStorage';
import ResourceMultiAuth from '@/src/components/Assets/Resources/Auth/ResourceMultiAuth';
import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import ResourceSourceField from '@/src/components/Assets/Resources/ResourceSourceField';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IconControl from '@/src/components/BaseControls/Icon';
import IdControl from '@/src/components/BaseControls/Id/Id';
import InterfacesField from '@/src/components/BaseControls/InterfacesField/InterfacesField';
import IntroControl from '@/src/components/BaseControls/Intro';
import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import OverrideNameControl from '@/src/components/BaseControls/OverrideName';
import TopicsControl from '@/src/components/BaseControls/Topics';
import VersionControl from '@/src/components/BaseControls/Version';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import Defaults from '@/src/components/Defaults/Defaults';
import { getAssetCreateFolderHandler } from '@/src/components/EntityListView/utils';
import EntityAttachments from '@/src/components/EntityMainProperties/EntityAttachments/EntityAttachments';
import { ASSET_APPLICATION_SOURCE_ITEMS } from '@/src/components/SourceField/constants';
import { ASSET_APPLICATION_INTERFACE_TYPES } from '@/src/constants/deployment-interfaces';
import { BasicI18nKey, EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { isPlatformBucketPath } from '@/src/utils/files/root-folder';

interface Props {
  asset: DialApplicationResource;
  runners?: DialApplicationScheme[];
  onChange: (asset: DialApplicationResource) => void;
  isPublication?: boolean;
}

const ApplicationAssetProperties: FC<Props> = ({ asset, runners, onChange, isPublication }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { codeAppEditorUrl } = useAppContext();

  const assetApp = asset as DialApplicationResource;
  const schemaSourceId = assetApp.application_type_schema_id;

  const appRunner = useMemo(
    () => getAppRunner(assetApp, runners ?? [], ApplicationRoute.AssetsApplications),
    [assetApp, runners],
  );

  const showResponsesDefaults =
    (!schemaSourceId && !!assetApp.responses_endpoint) ||
    (!!schemaSourceId && !!appRunner?.['dial:applicationTypeResponsesEndpoint']);

  const headerPostfix = useMemo(() => {
    return (
      <>
        <FoldersStorageLabel asset={asset} />
      </>
    );
  }, [asset]);

  return (
    <div className="flex flex-col">
      {!isPublication && <ResourceInfoHeader entity={asset} postfix={headerPostfix} />}
      <div className={classNames('flex flex-col gap-y-8', !isPublication && 'mt-8')}>
        {isPublication && (
          <IdControl entity={asset} onChangeEntity={onChange} checkEmptySymbols={false} isFullWidth={false} />
        )}
        <DisplayNameControl
          displayName={asset.display_name}
          required
          isFullWidth={false}
          onChange={(display_name) => onChange({ ...asset, display_name })}
        />
        {isPublication && (
          <VersionControl
            containerClassName="w-[175px]"
            version={asset.version}
            onChange={(version?: string) =>
              onChange?.({ ...asset, version: version || '', display_version: version || '' })
            }
          />
        )}
        <DescriptionControl entity={asset} onChangeEntity={onChange} isFullWidth={false} />
        <IntroControl entity={asset} onChangeEntity={onChange} isFullWidth={false} />

        <IconControl iconUrl={asset.icon_url} onChange={(icon_url) => onChange({ ...asset, icon_url })} />
        <TopicsControl entity={asset} onChange={onChange} view={ApplicationRoute.AssetsApplications} />

        {/* The platform bucket is flat — no folder tree to move into (design.md's `platform-applications` capability) — so this control is meaningless there and is hidden rather than shown-but-inert. */}
        {!isPublication && !isPlatformBucketPath(asset.folderId) && (
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

        <ResourceSourceField
          id="sourceType"
          view={ApplicationRoute.AssetsApplications}
          label={t(EntitiesI18nKey.SourceType)}
          sourceItems={ASSET_APPLICATION_SOURCE_ITEMS}
          entity={asset as DialApplicationResource}
          onChange={onChange as (entity: DialApplicationResource) => void}
          runners={runners}
          isEntityImmutable={true}
          codeAppEditorUrl={codeAppEditorUrl}
        />
        <InterfacesField
          entity={asset}
          onChangeEntity={onChange}
          allowedTypes={ASSET_APPLICATION_INTERFACE_TYPES}
          isAsset
        />
        <OverrideNameControl entity={asset as any} onChangeEntity={onChange} isAsset />
        <ResourceMultiAuth asset={asset} onChange={onChange} />
        <EntityAttachments entity={asset} onChangeEntity={onChange} isAsset />
        <Defaults
          values={(asset as DialApplication).defaults}
          onChangeValues={(defaults) => onChange({ ...asset, defaults } as DialApplicationResource)}
          title={t(EntityFieldsI18nKey.completionDefaults)}
        />
        {showResponsesDefaults && (
          <Defaults
            values={asset.responses_defaults}
            onChangeValues={(responses_defaults) =>
              onChange({ ...asset, responses_defaults } as DialApplicationResource)
            }
            title={t(EntityFieldsI18nKey.responsesDefaults)}
            validationKey="responsesDefaultKeys"
          />
        )}
        <MaxRetryAttempts entity={asset} onChangeEntity={onChange} isAsset />
      </div>
    </div>
  );
};

export default ApplicationAssetProperties;
