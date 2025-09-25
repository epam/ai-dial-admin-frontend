import { FC, useCallback } from 'react';

import { IconExternalLink } from '@tabler/icons-react';

import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import Tooltip from '@/src/components/Common/Tooltip/Tooltip';
import { EntitiesI18nKey, EntityFieldsI18nKey, PublicationsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialAssetApp } from '@/src/models/dial/asset-app';
import { ApplicationRoute } from '@/src/types/routes';
import { removeTrailingSlash } from '@/src/utils/files/path';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

interface Props {
  app: DialAssetApp;
}

const AppHeader: FC<Props> = ({ app }) => {
  const t = useI18n() as (t: string) => string;
  const currentLocale = useCurrentLocale();

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
    <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary mb-3">
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
  );
};

export default AppHeader;
