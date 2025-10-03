import { useRouter } from 'next/navigation';
import { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';

import { getApp } from '@/src/app/[lang]/assets-applications/actions';
import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import IconControl from '@/src/components/EntityMainProperties/BaseProperties/Icon';
import TopicsControl from '@/src/components/EntityMainProperties/BaseProperties/Topics';
import { BasicI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialAssetApp } from '@/src/models/dial/asset-app';
import { DialFile } from '@/src/models/dial/file';
import { ApplicationRoute } from '@/src/types/routes';
import { modifyNameVersionInPrompt } from '@/src/utils/prompts/versions';

interface Props {
  app: DialAssetApp;
  apps: DialAssetApp[];
  onChangeApp: (app: DialAssetApp) => void;
  setSelectedApp?: Dispatch<SetStateAction<DialAssetApp>>;
}

const AppProperties: FC<Props> = ({ app, apps, onChangeApp, setSelectedApp }) => {
  const t = useI18n() as (t: string) => string;
  const router = useRouter();

  const items = useMemo(() => {
    return apps.map((app) => ({ id: app.version, name: app.version }));
  }, [apps]);

  const onChangeVersion = useCallback(
    async (version: string) => {
      const found = await getApp?.(app.folderId, app.name as string, version);
      if (found) {
        setSelectedApp?.({} as DialAssetApp);
        router.push(
          `${ApplicationRoute.AssetsApplications}/${`${encodeURIComponent((found as DialAssetApp).name as string)}?path=${encodeURIComponent(found.path)}`}`,
        );
      } else {
        const path = modifyNameVersionInPrompt(app.path, void 0, version);
        onChangeApp?.({
          ...app,
          version,
          path,
        });
      }
    },
    [app, setSelectedApp, router, onChangeApp],
  );

  return (
    <div className="h-full flex flex-col pt-3 w-full">
      <div className="flex flex-col gap-6 pr-6">
        <div className="flex items-end gap-4">
          <div className="w-[105px]">
            <DropdownField
              elementCssClass="lg:w-[35%]"
              selectedValue={app.version}
              elementId="version"
              items={items}
              fieldTitle={t(EntityFieldsI18nKey.displayVersion)}
              onChange={onChangeVersion}
            />
          </div>
        </div>
        <div className="lg:w-[35%]">
          <DescriptionControl entity={app} onChangeEntity={onChangeApp} />
        </div>

        <IconControl iconUrl={app.iconUrl} onChange={(icon) => onChangeApp({ ...app, iconUrl: icon })} />
        <div className="lg:w-[35%]">
          <TopicsControl entity={app} onChange={onChangeApp} view={ApplicationRoute.AssetsApplications} />
        </div>

        <div className="lg:w-[35%]">
          <FilePath
            value={app.folderId}
            label={t(FoldersI18nKey.Storage)}
            modalTitle={t(BasicI18nKey.MoveToFolder)}
            placeholder={t(EntityPlaceholdersI18nKey.Path)}
            onChange={(folderId) => onChangeApp?.({ ...app, folderId })}
            context={useAppsFolder as () => AssetsFolderContext<DialAssetApp | DialFile>}
          />
        </div>
      </div>
    </div>
  );
};

export default AppProperties;
