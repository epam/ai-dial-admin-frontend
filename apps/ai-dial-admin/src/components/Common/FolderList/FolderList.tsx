import { FC, useCallback, useEffect, useMemo } from 'react';

import { DialEllipsisTooltip, DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { IconCaretDownFilled, IconCaretRightFilled, IconFolder } from '@tabler/icons-react';
import classNames from 'classnames';

import { ROOT_FOLDER } from '@/src/constants/file';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { RuleFolderContextType } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { Asset, AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { isFolder } from '@/src/utils/files/path';

interface Props {
  disableAutoFetch?: boolean;
  initialPath?: string;
  context?: () => AssetsFolderContext | RuleFolderContextType;
}

const FolderList: FC<Props> = ({ context, initialPath, disableAutoFetch }) => {
  const t = useI18n();
  const folderContext = context?.();

  const folderData = useMemo(() => {
    return folderContext?.files;
  }, [folderContext]);

  const scrollToFolder = useCallback(() => {
    let attempts = 0;
    const maxAttempts = 20;
    const scrollInterval = setInterval(() => {
      const selectedElement = document.querySelector('[aria-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        clearInterval(scrollInterval);
      } else if (attempts >= maxAttempts) {
        clearInterval(scrollInterval);
      }
      attempts++;
    }, 500);
  }, []);

  useEffect(() => {
    const context = folderContext as RuleFolderContextType;
    if (initialPath && context?.fetchFolderHierarchy && (context?.files == null || context?.files?.length === 0)) {
      context?.fetchFolderHierarchy(initialPath, true);
      scrollToFolder();
    } else if (
      !disableAutoFetch &&
      !initialPath &&
      (folderContext?.files == null || folderContext?.files?.length === 0)
    ) {
      folderContext?.fetchFiles(`${ROOT_FOLDER}/`);
    }
  }, [folderContext, disableAutoFetch, initialPath, scrollToFolder]);

  const getFolderClassName = (node: DialFile, level: number) => {
    const isSelected = folderContext?.filePath === node.path;
    const baseClassName = `flex justify-between pl-${level * 5}`;
    const selectedClassName = isSelected
      ? 'bg-accent-primary-alpha border-l-2 border-l-accent-primary rounded'
      : 'border-l-2 border-l-transparent';
    const iconClassName =
      !node.items?.some((c) => isFolder(c.nodeType)) && folderContext?.fetchedFoldersData[node.path]
        ? 'text-transparent'
        : '';
    return { baseClassName, selectedClassName, iconClassName };
  };

  const renderTree = (nodes: Asset[] | undefined, level: number) => {
    return nodes?.map((node) => {
      const { path, nodeType, items, name } = node;
      const { baseClassName, selectedClassName, iconClassName } = getFolderClassName(node, level);
      const isExpanded = folderContext?.expandedFolders.has(path);

      return (
        <div key={path} className="small-medium cursor-pointer text-secondary">
          {isFolder(nodeType) && (
            <div className="flex flex-col">
              <div
                aria-selected={path === folderContext?.filePath}
                className={classNames('group py-2', baseClassName, selectedClassName)}
              >
                <div
                  className="flex-1 flex flex-row truncate"
                  onClick={() => folderContext?.toggleFolder(node as AssetWithVersion)}
                >
                  <div className={classNames(iconClassName, 'flex items-center justify-center')}>
                    {isExpanded ? (
                      <IconCaretDownFilled {...BASE_BUTTON_ICON_PROPS} widths={10} height={10} className="shrink-0" />
                    ) : (
                      <IconCaretRightFilled {...BASE_BUTTON_ICON_PROPS} widths={10} height={10} className="shrink-0" />
                    )}
                  </div>
                  <IconFolder {...BASE_BUTTON_ICON_PROPS} className={classNames('shrink-0 mr-2')} />
                  <DialEllipsisTooltip text={name} className="text-primary" />
                </div>
              </div>
            </div>
          )}

          {isExpanded && items && <div key={`${path}-children`}>{renderTree(items, level + 1)}</div>}
        </div>
      );
    });
  };

  const ruleContext = folderContext as RuleFolderContextType | undefined;
  const assetsContext = folderContext as AssetsFolderContext | undefined;
  const isRuleFolderContext = ruleContext?.fetchFolderHierarchy != null;
  const isFetching = isRuleFolderContext
    ? ruleContext.isLoading || ruleContext.files == null
    : !!assetsContext?.isFetchingFiles;
  const showNoFolders = !isFetching && !folderContext?.files?.length;

  return (
    <div className="flex-1 size-full overflow-y-auto">
      {isFetching ? (
        <div className="flex size-full items-center justify-center">
          <DialLoader size={40} />
        </div>
      ) : showNoFolders ? (
        <DialNoDataContent title={t(EntitiesI18nKey.NoFolders)} />
      ) : (
        renderTree(folderData ?? undefined, 0)
      )}
    </div>
  );
};

export default FolderList;
