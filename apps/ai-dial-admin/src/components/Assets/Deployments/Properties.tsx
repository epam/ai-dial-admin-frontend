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
import { DialAssetApp } from '@/src/models/dial/asset-app';
import { DialFile } from '@/src/models/dial/file';
import { AssetToolset } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { modifyNameVersionInPrompt } from '@/src/utils/prompts/versions';

interface Props {
  etag: string;
  view: ApplicationRoute;
  asset: DialAssetApp | AssetToolset;
  assets: (DialAssetApp | AssetToolset)[];
  onChange: (asset: DialAssetApp | AssetToolset) => void;
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
          const found = res.response as DialAssetApp | AssetToolset;

          if (found) {
            onChange?.({} as DialAssetApp | AssetToolset);
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
    <div className="h-full flex flex-col pt-3 w-full">
      <div className="flex flex-col gap-6 pr-6">
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
        <div className="lg:w-[35%]">
          <TopicsControl entity={asset} onChange={onChange} view={view} />
        </div>

        <div className="lg:w-[35%]">
          <FilePath
            value={asset.folderId}
            label={t(FoldersI18nKey.Storage)}
            modalTitle={t(BasicI18nKey.MoveToFolder)}
            placeholder={t(EntityPlaceholdersI18nKey.Path)}
            onChange={(folderId) => onChange?.({ ...asset, folderId })}
            context={
              view === ApplicationRoute.AssetsApplications
                ? (useAppsFolder as () => AssetsFolderContext<DialAssetApp | DialFile>)
                : (useToolsetFolder as () => AssetsFolderContext<AssetToolset | DialFile>)
            }
          />
        </div>
      </div>
    </div>
  );
};

export default DeploymentProperties;
