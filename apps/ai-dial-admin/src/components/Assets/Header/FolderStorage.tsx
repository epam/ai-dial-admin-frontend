import { FC, useCallback } from 'react';

import { DialIconButton, DialLabelledText } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { Publication } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { removeTrailingSlash } from '@/src/utils/files/path';

interface Props {
  asset: AssetWithVersion | DialFile | Publication;
}

const FoldersStorageLabel: FC<Props> = ({ asset }) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();

  const openFolderStorageInNewTab = useCallback(
    (path: string) => {
      window.open(`/${currentLocale}${ApplicationRoute.FoldersStorage}?path=${encodeURIComponent(path)}`, '_blank');
    },
    [currentLocale],
  );

  return (
    <DialLabelledText
      label={t(EntitiesI18nKey.FolderStorage)}
      text={removeTrailingSlash(asset.folderId)}
      postfix={
        <DialIconButton
          className="p-0 h-[20px] w-[20px] text-secondary"
          tooltipProps={{ triggerClassName: 'h-[20px] w-[20px]' }}
          onClick={() => openFolderStorageInNewTab(asset.folderId)}
          icon={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
        />
      }
    />
  );
};

export default FoldersStorageLabel;
