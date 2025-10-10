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

interface Props {
  app: DialAssetApp;
}

const AppHeader: FC<Props> = ({ app }) => {
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
      <LabelledText label={t(EntityFieldsI18nKey.displayName)} text={app.name} copyButton={true} />
      {app.applicationTypeSchemaId && (
        <LabelledText label={t(EntitiesI18nKey.Runner)}>
          <div className="flex flex-row gap-1 items-center max-w-[400px]">
            <DialTooltip tooltip={app.applicationTypeSchemaId}>{app.applicationTypeSchemaId}</DialTooltip>
            <button
              onClick={() => onOpenInNewTab(ApplicationRoute.ApplicationRunners, { $id: app.applicationTypeSchemaId })}
              className="text-secondary"
            >
              <IconExternalLink {...BASE_ICON_PROPS} />
            </button>
          </div>
        </LabelledText>
      )}
      {app.author && <LabelledText label={t(EntitiesI18nKey.Author)} text={app.author} />}
      <LabelledText label={t(EntityFieldsI18nKey.createdAt)} text={formatDateTimeToLocalString(app.createdAt)} />
      <LabelledText label={t(EntityFieldsI18nKey.updatedAt)} text={formatDateTimeToLocalString(app.updateTime)} />
      <LabelledText label={t(EntitiesI18nKey.FolderStorage)}>
        <div className="flex flex-row gap-1 items-center">
          <Tooltip tooltip={app.folderId}>{removeTrailingSlash(app.folderId)}</Tooltip>
          <DialButton
            onClick={() => openFolderStorageInNewTab(app.folderId)}
            cssClass="text-secondary"
            iconBefore={<IconExternalLink {...BASE_ICON_PROPS} />}
          />
        </div>
      </LabelledText>
    </div>
  );
};

export default AppHeader;
