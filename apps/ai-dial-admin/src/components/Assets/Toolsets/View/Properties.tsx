import { FC, useMemo } from 'react';

import { DialInput, DialSwitch } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import FoldersStorageLabel from '@/src/components/Assets/Header/FolderStorage';
import ResourceAuthentication from '@/src/components/Assets/Resources/Auth/ResourceAuthentication';
import ResourceAuthHeader from '@/src/components/Assets/Resources/Auth/ResourceAuthHeader';
import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IconControl from '@/src/components/BaseControls/Icon';
import IdControl from '@/src/components/BaseControls/Id/Id';
import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import TopicsControl from '@/src/components/BaseControls/Topics';
import VersionControl from '@/src/components/BaseControls/Version';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import { getAssetCreateFolderHandler } from '@/src/components/EntityListView/utils';
import ToolsetEndpoint from '@/src/components/SourceField/Endpoints/ToolsetEndpoint';
import { BasicI18nKey, EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialToolsetResource, ToolsetAuthType } from '@/src/models/dial/resource';
import { TOOLSET_AUTH_REDIRECT_URL } from '@/src/components/Assets/Resources/Auth/ResourceAuthButtons';
import { Toolset } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  selectedToolset: DialToolsetResource;
  onChange: (asset: DialToolsetResource) => void;
  isPublication?: boolean;
}

const ToolsetAssetProperties: FC<Props> = ({ selectedToolset, onChange, isPublication }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const headerPostfix = useMemo(() => {
    return (
      <>
        <ResourceAuthHeader toolset={selectedToolset} />
        <FoldersStorageLabel asset={selectedToolset} />
      </>
    );
  }, [selectedToolset]);

  return (
    <div className="flex flex-col">
      {!isPublication && <ResourceInfoHeader entity={selectedToolset} postfix={headerPostfix} />}
      <div className={classNames('flex flex-col gap-y-8', !isPublication && 'mt-8')}>
        {isPublication && (
          <IdControl entity={selectedToolset} onChangeEntity={onChange} checkEmptySymbols={false} isFullWidth={false} />
        )}
        <DisplayNameControl
          displayName={selectedToolset.display_name}
          required
          isFullWidth={false}
          onChange={(display_name) => onChange({ ...selectedToolset, display_name })}
        />
        {isPublication && (
          <VersionControl
            containerClassName="w-[175px]"
            version={selectedToolset.version}
            onChange={(version?: string) =>
              onChange?.({ ...selectedToolset, version: version || '', display_version: version || '' })
            }
          />
        )}
        <DescriptionControl entity={selectedToolset} onChangeEntity={onChange} isFullWidth={false} />

        <DialInput
          containerClassName={STANDARD_CONTROL_WIDTH}
          id="provider"
          labelProps={{ label: t(EntityFieldsI18nKey.provider) }}
          placeholder={t(EntityPlaceholdersI18nKey.Provider)}
          value={selectedToolset.provider}
          onChange={(provider?: string) => onChange({ ...selectedToolset, provider })}
          disabled={isReadOnlyAdmin}
        />

        <IconControl
          iconUrl={selectedToolset.icon_url}
          onChange={(icon_url) => onChange({ ...selectedToolset, icon_url })}
        />
        <TopicsControl entity={selectedToolset} onChange={onChange} view={ApplicationRoute.AssetsToolsets} />

        {!isPublication && (
          <FilePath
            value={selectedToolset.folderId}
            label={t(EntitiesI18nKey.FolderStorage)}
            modalTitle={t(BasicI18nKey.MoveToFolder)}
            placeholder={t(EntityPlaceholdersI18nKey.Path)}
            onChange={(folderId) => onChange?.({ ...selectedToolset, folderId })}
            context={useToolsetFolder}
            disabled={isReadOnlyAdmin}
            onCreateFolder={getAssetCreateFolderHandler(ApplicationRoute.AssetsToolsets)}
            view={ApplicationRoute.AssetsToolsets}
          />
        )}
        <ToolsetEndpoint entity={selectedToolset} onChange={onChange as (entity: Toolset) => void} isAsset />
        <ResourceAuthentication
          name={selectedToolset.name || ''}
          authSettings={selectedToolset.auth_settings}
          redirectUrl={TOOLSET_AUTH_REDIRECT_URL}
          onChange={(auth_settings, forward_per_request_key) =>
            onChange({
              ...selectedToolset,
              auth_settings,
              forward_per_request_key: forward_per_request_key ?? selectedToolset.forward_per_request_key,
            })
          }
        />
        <DialSwitch
          isOn={selectedToolset.forward_per_request_key}
          label={t(EntityFieldsI18nKey.forwardPerRequestKey)}
          switchId="forwardPerRequestKey"
          disabled={selectedToolset.auth_settings?.authentication_type === ToolsetAuthType.API_KEY || isReadOnlyAdmin}
          onChange={(value: boolean) => {
            onChange({ ...selectedToolset, forward_per_request_key: value });
          }}
        />
        <MaxRetryAttempts entity={selectedToolset} onChangeEntity={onChange} isAsset />
      </div>
    </div>
  );
};

export default ToolsetAssetProperties;
