import { FC, useCallback, useMemo } from 'react';

import { DialButton, DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';
import classNames from 'classnames';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EntitiesI18nKey, EntityFieldsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { AssetToolset, DeploymentAsset } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import { removeTrailingSlash } from '@/src/utils/files/path';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import ValidityStatus from '@/src/components/EntityView/Status/ValidityStatus';
import { isAdminLoggedInToToolset, isUserLoggedInToToolset } from '@/src/utils/toolset/toolset-auth';
import { EntityValidityState } from '@/src/models/dial/base-entity';

interface Props {
  view: ApplicationRoute;
  asset: DeploymentAsset;
}

const DeploymentAssetHeader: FC<Props> = ({ view, asset }) => {
  const t = useI18n() as (t: string) => string;
  const currentLocale = useCurrentLocale();
  const validityState = (asset as EntityValidityState)?.validityState;

  const openFolderStorageInNewTab = useCallback(
    (path: string) => {
      window.open(`/${currentLocale}${ApplicationRoute.FoldersStorage}?path=${encodeURIComponent(path)}`, '_blank');
    },
    [currentLocale],
  );

  const toolsetAuthInfo = useMemo(() => {
    const toolset = asset as AssetToolset;
    const isUserLoggedIn = isUserLoggedInToToolset(toolset);
    const isAdminLoggedIn = isAdminLoggedInToToolset(toolset);

    return (
      <LabelledText label={t(EntityFieldsI18nKey.authentication)}>
        <div className="flex items-center gap-2">
          <div
            className={classNames(
              'w-[10px] h-[10px] rounded-full',
              isUserLoggedIn || isAdminLoggedIn ? 'bg-accent-secondary' : 'bg-red-400',
            )}
          ></div>
          <div>
            {isUserLoggedIn
              ? t(ToolsetI18nKey.UserLoggedIn)
              : isAdminLoggedIn
                ? t(ToolsetI18nKey.AdminLoggedIn)
                : t(ToolsetI18nKey.LoggedOut)}
          </div>
        </div>
      </LabelledText>
    );
  }, [asset, t]);

  return (
    <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary">
      <LabelledText label={t(EntityFieldsI18nKey.id)} text={asset.name} copyable={true} />
      {asset.author && <LabelledText label={t(EntitiesI18nKey.Author)} text={asset.author} />}
      <LabelledText label={t(EntityFieldsI18nKey.createdAt)} text={formatDateTimeToLocalString(asset.createdAt)} />
      <LabelledText label={t(EntityFieldsI18nKey.updatedAt)} text={formatDateTimeToLocalString(asset.updatedAt)} />
      {view === ApplicationRoute.AssetsToolsets && toolsetAuthInfo}

      <LabelledText label={t(EntitiesI18nKey.FolderStorage)}>
        <div className="flex flex-row gap-1 items-center">
          <DialEllipsisTooltip text={removeTrailingSlash(asset.folderId)} />
          <DialButton
            onClick={() => openFolderStorageInNewTab(asset.folderId)}
            className="text-secondary"
            iconBefore={<IconExternalLink {...BASE_ICON_PROPS} />}
          />
        </div>
      </LabelledText>

      {validityState && (
        <LabelledText label={t(EntityFieldsI18nKey.status)}>
          <ValidityStatus validityState={validityState} />
        </LabelledText>
      )}
    </div>
  );
};

export default DeploymentAssetHeader;
