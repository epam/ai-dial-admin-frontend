import { FC, useCallback } from 'react';

import { DialEllipsisTooltip, DialIconButton } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import ValidityStatus from '@/src/components/EntityView/Status/ValidityStatus';
import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { EntityValidityState } from '@/src/models/dial/base-entity';
import { Asset } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { ApplicationRoute } from '@/src/types/routes';
import { removeTrailingSlash } from '@/src/utils/files/path';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { AuthHeader } from '@/src/components/Toolsets/Auth/Sections/AuthHeader';
import { Toolset } from '@/src/models/dial/toolset';

interface Props {
  view: ApplicationRoute;
  asset: Asset | DialFile;
}

const AssetHeader: FC<Props> = ({ view, asset }) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const validityState = (asset as EntityValidityState)?.validityState;

  const openFolderStorageInNewTab = useCallback(
    (path: string) => {
      window.open(`/${currentLocale}${ApplicationRoute.FoldersStorage}?path=${encodeURIComponent(path)}`, '_blank');
    },
    [currentLocale],
  );

  return (
    <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary">
      <LabelledText label={t(EntityFieldsI18nKey.id)} text={asset.name} copyable={true} />
      {asset.author && <LabelledText label={t(EntitiesI18nKey.Author)} text={asset.author} />}
      {asset.createdAt && (
        <LabelledText label={t(EntityFieldsI18nKey.createdAt)} text={formatDateTimeToLocalString(asset.createdAt)} />
      )}
      <LabelledText label={t(EntityFieldsI18nKey.updatedAt)} text={formatDateTimeToLocalString(asset.updatedAt)} />
      {view === ApplicationRoute.AssetsToolsets && <AuthHeader toolset={asset as Toolset} />}

      <LabelledText label={t(EntitiesI18nKey.FolderStorage)}>
        <div className="flex flex-row gap-1 items-center">
          <DialEllipsisTooltip text={removeTrailingSlash(asset.folderId)} />
          <DialIconButton
            className="p-0 h-auto w-auto text-secondary"
            onClick={() => openFolderStorageInNewTab(asset.folderId)}
            icon={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
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

export default AssetHeader;
