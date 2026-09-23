import { FC, useCallback } from 'react';

import { DialIconButton, DialLabelledText } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { CoreResourceEntityMetadata } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { removeTrailingSlash } from '@/src/utils/files/path';
import { isPlatformBucketPath } from '@/src/utils/files/root-folder';

interface Props {
  /**
   * Every folder-bearing entity qualifies; this reads nothing else off it. Callers passing a merged
   * Core-resource detail entity resolve the folder themselves (`folderId ?? _metadata?.folderId`)
   * since the flat field is create-flow-only there.
   */
  asset: { folderId?: string; _metadata?: CoreResourceEntityMetadata };
}

const FoldersStorageLabel: FC<Props> = ({ asset }) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  // A `const` so the `folderId &&` guard keeps narrowing inside the click closure below.
  const { folderId, _metadata } = asset;

  const folder = _metadata?.folderId || folderId || '';

  const openFolderStorageInNewTab = useCallback(
    (path: string) => {
      window.open(`/${currentLocale}${ApplicationRoute.FoldersStorage}?path=${encodeURIComponent(path)}`, '_blank');
    },
    [currentLocale],
  );

  if (isPlatformBucketPath(folder)) {
    return <DialLabelledText label={t(EntitiesI18nKey.FolderStorage)} text={removeTrailingSlash(folder)} />;
  }

  return (
    folderId && (
      <DialLabelledText
        label={t(EntitiesI18nKey.FolderStorage)}
        text={removeTrailingSlash(folder)}
        postfix={
          <DialIconButton
            className="text-secondary size-[20px]"
            onClick={() => openFolderStorageInNewTab(folder)}
            icon={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
          />
        }
      />
    )
  );
};

export default FoldersStorageLabel;
