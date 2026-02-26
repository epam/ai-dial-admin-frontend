import { FC } from 'react';

import { DialSwitch } from '@epam/ai-dial-ui-kit';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IconControl from '@/src/components/BaseControls/Icon';
import IdControl from '@/src/components/BaseControls/Id/Id';
import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import TopicsControl from '@/src/components/BaseControls/Topics';
import VersionControl from '@/src/components/BaseControls/Version';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import ToolsetEndpoint from '@/src/components/SourceField/Endpoints/ToolsetEndpoint';
import Authentication from '@/src/components/Toolsets/Auth/Authentication';
import { BasicI18nKey, EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { Toolset, ToolsetAuthType } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  selectedToolset: AssetToolset;
  onChange: (asset: AssetToolset) => void;
  isPublication?: boolean;
}

const Properties: FC<Props> = ({ selectedToolset, onChange, isPublication }) => {
  const t = useI18n();

  return (
    <div className="h-full flex flex-col w-full gap-y-8">
      {isPublication && (
        <IdControl entity={selectedToolset} onChangeEntity={onChange} checkEmptySymbols={false} isFullWidth={false} />
      )}
      <DisplayNameControl
        displayName={selectedToolset.displayName}
        required={true}
        isFullWidth={false}
        onChange={(displayName) => onChange({ ...selectedToolset, displayName })}
      />
      {isPublication && (
        <VersionControl
          elementContainerClassName="w-[175px]"
          version={selectedToolset.version}
          onChange={(version?: string) =>
            onChange?.({ ...selectedToolset, version: version || '', displayVersion: version || '' })
          }
        />
      )}
      <DescriptionControl entity={selectedToolset} onChangeEntity={onChange} isFullWidth={false} />

      <IconControl
        iconUrl={selectedToolset.iconUrl}
        onChange={(icon) => onChange({ ...selectedToolset, iconUrl: icon })}
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
        />
      )}
      <ToolsetEndpoint entity={selectedToolset} onChange={onChange as (entity: Toolset) => void} />
      <Authentication
        toolset={selectedToolset}
        view={ApplicationRoute.AssetsToolsets}
        onChange={onChange as (entity: Toolset) => void}
      />
      <DialSwitch
        isOn={selectedToolset.forwardPerRequestKey}
        label={t(EntityFieldsI18nKey.forwardPerRequestKey)}
        switchId="forwardPerRequestKey"
        disabled={selectedToolset.authSettings?.authenticationType === ToolsetAuthType.API_KEY}
        onChange={(value: boolean) => {
          onChange({ ...selectedToolset, forwardPerRequestKey: value });
        }}
      />

      <MaxRetryAttempts entity={selectedToolset} onChangeEntity={onChange} />
    </div>
  );
};

export default Properties;
