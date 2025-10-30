import { FC, useCallback } from 'react';

import { DialButton, DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DeploymentAsset } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import { removeTrailingSlash } from '@/src/utils/files/path';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

interface Props {
  asset: DeploymentAsset;
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
      <LabelledText label={t(EntityFieldsI18nKey.id)} text={asset.name} copyable={true} />
      {asset.author && <LabelledText label={t(EntitiesI18nKey.Author)} text={asset.author} />}
      <LabelledText label={t(EntityFieldsI18nKey.createdAt)} text={formatDateTimeToLocalString(asset.createdAt)} />
      <LabelledText label={t(EntityFieldsI18nKey.updatedAt)} text={formatDateTimeToLocalString(asset.updatedAt)} />
      <LabelledText label={t(EntitiesI18nKey.FolderStorage)}>
        <div className="flex flex-row gap-1 items-center">
          <DialEllipsisTooltip text={removeTrailingSlash(asset.folderId)} />
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
