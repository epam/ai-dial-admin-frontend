import { useRouter } from 'next/navigation';
import { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';

import { IconExternalLink } from '@tabler/icons-react';

import { getApp } from '@/src/app/[lang]/assets-applications/actions';
import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import Tooltip from '@/src/components/Common/Tooltip/Tooltip';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import IconControl from '@/src/components/EntityMainProperties/BaseProperties/Icon';
import TopicsControl from '@/src/components/EntityMainProperties/BaseProperties/Topics';
import {
  BasicI18nKey,
  EntitiesI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  FoldersI18nKey,
  PublicationsI18nKey,
} from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppsFolder } from '@/src/context/AppsFolderContext';
import { AssetsFolderContext } from '@/src/context/AssetsFolderContext';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialAssetApp } from '@/src/models/dial/asset-app';
import { DialFile } from '@/src/models/dial/file';
import { ApplicationRoute } from '@/src/types/routes';
import { removeTrailingSlash } from '@/src/utils/files/path';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { modifyNameVersionInPrompt } from '@/src/utils/prompts/versions';

interface Props {
  app: DialAssetApp;
  apps: DialAssetApp[];
  onChangeApp: (app: DialAssetApp) => void;
  setSelectedApp: Dispatch<SetStateAction<DialAssetApp>>;
}

const AppProperties: FC<Props> = ({ app, apps, onChangeApp, setSelectedApp }) => {
  const t = useI18n() as (t: string) => string;
  const router = useRouter();
  const currentLocale = useCurrentLocale();

  const items = useMemo(() => {
    return apps.map((app) => ({ id: app.version, name: app.version }));
  }, [apps]);

  const onChangeVersion = useCallback(
    async (version: string) => {
      const found = await getApp?.(app.folderId, app.name as string, version);
      if (found) {
        setSelectedApp({} as DialAssetApp);
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

  const openRunnerInNewTab = useCallback(
    (runnerId: string) => {
      window.open(`/${currentLocale}${ApplicationRoute.ApplicationRunners}/${encodeURIComponent(runnerId)}`, '_blank');
    },
    [currentLocale],
  );

  const openFolderStorageInNewTab = useCallback(
    (path: string) => {
      window.open(`/${currentLocale}${ApplicationRoute.FoldersStorage}?path=${encodeURIComponent(path)}`, '_blank');
    },
    [currentLocale],
  );

  return (
    <div className="h-full flex flex-col pt-3 divide-y divide-primary w-full">
      <div className="flex flex-row gap-10 mb-6">
        <LabeledText label={t(EntityFieldsI18nKey.displayName)} text={app.name} copyButton={true} />
        {app.customAppSchemaId && (
          <LabeledText label={t(PublicationsI18nKey.Runner)}>
            <div className="flex flex-row gap-1 items-center">
              <Tooltip tooltip={app.customAppSchemaId}>{app.customAppSchemaId}</Tooltip>
              <button onClick={() => openRunnerInNewTab(app.customAppSchemaId as string)} className="text-secondary">
                <IconExternalLink {...BASE_ICON_PROPS} />
              </button>
            </div>
          </LabeledText>
        )}
        {app.author && <LabeledText label={t(EntitiesI18nKey.Author)} text={app.author} />}
        <LabeledText label={t(EntityFieldsI18nKey.createdAt)} text={formatDateTimeToLocalString(app.createdAt)} />
        <LabeledText label={t(EntityFieldsI18nKey.updatedAt)} text={formatDateTimeToLocalString(app.updateTime)} />
        <LabeledText label={t(PublicationsI18nKey.FolderStorage)}>
          <div className="flex flex-row gap-1 items-center">
            <Tooltip tooltip={app.folderId}>{removeTrailingSlash(app.folderId)}</Tooltip>
            <button onClick={() => openFolderStorageInNewTab(app.folderId)} className="text-secondary">
              <IconExternalLink {...BASE_ICON_PROPS} />
            </button>
          </div>
        </LabeledText>
      </div>

      <div className="pt-6">
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
            <TopicsControl entity={app} onChange={onChangeApp} />
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
    </div>
  );
};

export default AppProperties;
