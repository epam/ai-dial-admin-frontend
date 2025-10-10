import { FC, useCallback } from 'react';

import { IconExternalLink } from '@tabler/icons-react';
import { DialButton, DialTooltip } from '@epam/ai-dial-ui-kit';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import Tooltip from '@/src/components/Common/Tooltip/Tooltip';
import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialAssetApp } from '@/src/models/dial/asset-app';
import { ApplicationRoute } from '@/src/types/routes';
import { removeTrailingSlash } from '@/src/utils/files/path';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { AssetToolset } from '@/src/models/dial/toolset';

interface Props {
  asset: DialAssetApp | AssetToolset;
}

const DeploymentAssetHeader: FC<Props> = ({ asset }) => {
  const t = useI18n() as (t: string) => string;
  const currentLocale = useCurrentLocale();

  const openFolderStorageInNewTab = useCallback(
    (path: string) => {
      window.open(`/${currentLocale}${ApplicationRoute.FoldersStorage}?path=${encodeURIComponent(path)}`, '_blank');
    },
    [currentLocale],
  );

  return (
    <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary mb-3">
      <LabelledText label={t(EntityFieldsI18nKey.displayName)} text={asset.name} copyable={true} />
      {(asset as DialAssetApp).applicationTypeSchemaId && (
        <LabelledText label={t(EntitiesI18nKey.Runner)}>
          <div className="flex flex-row gap-1 items-center max-w-[400px]">
            <DialTooltip tooltip={(asset as DialAssetApp).applicationTypeSchemaId}>
              {(asset as DialAssetApp).applicationTypeSchemaId}
            </DialTooltip>
            <DialButton
              onClick={() =>
                onOpenInNewTab(ApplicationRoute.ApplicationRunners, {
                  $id: (asset as DialAssetApp).applicationTypeSchemaId,
                })
              }
              iconBefore={<IconExternalLink {...BASE_ICON_PROPS} />}
              cssClass="text-secondary"
            />
          </div>
        </LabelledText>
      )}
      {asset.author && <LabelledText label={t(EntitiesI18nKey.Author)} text={asset.author} />}
      <LabelledText label={t(EntityFieldsI18nKey.createdAt)} text={formatDateTimeToLocalString(asset.createdAt)} />
      <LabelledText label={t(EntityFieldsI18nKey.updatedAt)} text={formatDateTimeToLocalString(asset.updateTime)} />
      <LabelledText label={t(EntitiesI18nKey.FolderStorage)}>
        <div className="flex flex-row gap-1 items-center">
          <Tooltip tooltip={asset.folderId}>{removeTrailingSlash(asset.folderId)}</Tooltip>
          <DialButton
            onClick={() => openFolderStorageInNewTab(asset.folderId)}
            cssClass="text-secondary"
            iconBefore={<IconExternalLink {...BASE_ICON_PROPS} />}
          />
        </div>
      </LabelledText>
    </div>
  );
};

export default DeploymentAssetHeader;
