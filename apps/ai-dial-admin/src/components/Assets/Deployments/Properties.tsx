import { useRouter } from 'next/navigation';
import { FC, useCallback, useMemo } from 'react';

import { getApp } from '@/src/app/[lang]/assets-applications/actions';
import { getToolset } from '@/src/app/[lang]/assets-toolsets/actions';
import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import IconControl from '@/src/components/EntityMainProperties/BaseProperties/Icon';
import TopicsControl from '@/src/components/EntityMainProperties/BaseProperties/Topics';
import { BasicI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { AssetApp, DeploymentAsset, AssetToolset } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { modifyNameVersionInPrompt } from '@/src/utils/prompts/versions';
import MaxRetryAttempts from '@/src/components/EntityMainProperties/BaseProperties/MaxRetryAttempts';
import ToolsetEndpoint from '@/src/components/SourceField/Endpoints/ToolsetEndpoint';
import { Toolset } from '@/src/models/dial/toolset';

interface Props {
  etag: string;
  view: ApplicationRoute;
  asset: DeploymentAsset;
  assets: DeploymentAsset[];
  onChange: (asset: DeploymentAsset) => void;
}

const DeploymentProperties: FC<Props> = ({ etag, asset, view, assets, onChange }) => {
  const t = useI18n() as (t: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();

  const items = useMemo(() => {
    return assets.map((asset) => ({ id: asset.version, name: asset.version }));
  }, [assets]);

  const onChangeVersion = useCallback(
    async (version: string) => {
      const getAsset = view === ApplicationRoute.AssetsApplications ? getApp : getToolset;

      getAsset?.(asset.folderId, asset.name as string, version, etag).then((res) => {
        if (res.success) {
          const found = res.response as DeploymentAsset;

          if (found) {
            onChange?.({} as DeploymentAsset);
            router.push(
              `${view}/${`${encodeURIComponent(found.name as string)}?path=${encodeURIComponent(found.path)}`}`,
            );
          } else {
            const path = modifyNameVersionInPrompt(asset.path, void 0, version);
            onChange?.({
              ...asset,
              version,
              path,
            });
          }
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [view, asset, etag, onChange, router, showNotification],
  );

  return (
    <div className="h-full flex flex-col w-full gap-y-6">
      <div className="flex flex-col gap-y-6">
        <div className="flex items-end gap-4">
          <div className="w-[105px]">
            <DropdownField
              elementCssClass="lg:w-[35%]"
              selectedValue={asset.version}
              elementId="version"
              items={items}
              fieldTitle={t(EntityFieldsI18nKey.displayVersion)}
              onChange={onChangeVersion}
            />
          </div>
        </div>
        <div className="lg:w-[35%]">
          <DescriptionControl entity={asset} onChangeEntity={onChange} />
        </div>

        <IconControl iconUrl={asset.iconUrl} onChange={(icon) => onChange({ ...asset, iconUrl: icon })} />
        <div className="lg:w-[35%] flex flex-col gap-y-6">
          <TopicsControl entity={asset} onChange={onChange} view={view} />

          <FilePath
            value={asset.folderId}
            label={t(FoldersI18nKey.Storage)}
            modalTitle={t(BasicI18nKey.MoveToFolder)}
            placeholder={t(EntityPlaceholdersI18nKey.Path)}
            onChange={(folderId) => onChange?.({ ...asset, folderId })}
            context={
              view === ApplicationRoute.AssetsApplications
                ? (useAppsFolder as () => AssetsFolderContext<AssetApp | DialFile>)
                : (useToolsetFolder as () => AssetsFolderContext<AssetToolset | DialFile>)
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-y-6">
        {view === ApplicationRoute.AssetsToolsets && (
          <>
            <ToolsetEndpoint entity={asset as AssetToolset} onChange={onChange as (entity: Toolset) => void} />
          </>
        )}
        <MaxRetryAttempts entity={asset} onChangeEntity={onChange} />
      </div>
    </div>
  );
};

export default DeploymentProperties;
