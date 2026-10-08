import { FC, useCallback, useEffect, useMemo } from 'react';

import { DialFile as FileManagerFile, DialFoldersTree } from '@epam/ai-dial-react-file-manager';
import { DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';

import { ROOT_FOLDER } from '@/src/constants/file';
import { EntitiesI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { RuleFolderContextType } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { Asset } from '@/src/models/dial/deployment-asset';
import { isFileRootPath } from '@/src/utils/files/root-folder';

interface Props {
  disableAutoFetch?: boolean;
  initialPath?: string;
  context?: () => AssetsFolderContextReader<AssetListItem> | RuleFolderContextType;
  /** Roots the empty-state auto-fetch loads — both buckets for dual-bucket views (see `getRootFolders`). */
  rootPaths?: string[];
}

const DEFAULT_ROOT_PATHS = [`${ROOT_FOLDER}/`];

// Expansion is owned by the folder context (`toggleFolder` runs from `onItemClick`). A handler must
// still be passed: its presence is what makes the tree controlled, and its own toggle is discarded.
const IGNORE_TREE_EXPANSION_CHANGE = () => undefined;

const FolderList: FC<Props> = ({ context, initialPath, disableAutoFetch, rootPaths = DEFAULT_ROOT_PATHS }) => {
  const t = useI18n();
  const folderContext = context?.();

  const folderData = useMemo(() => {
    return folderContext?.files?.filter((node) => !isFileRootPath(node.path));
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
      // Only the assets context has dual-bucket views (Applications/Toolsets) whose empty-state
      // fetch takes several roots at once; a rule folder always has a single root.
      const assetsContext = folderContext as AssetsFolderContextReader<AssetListItem> | undefined;
      if (rootPaths.length > 1 && assetsContext) {
        assetsContext.fetchFiles(rootPaths);
      } else {
        folderContext?.fetchFiles(rootPaths[0]);
      }
    }
  }, [folderContext, disableAutoFetch, initialPath, rootPaths, scrollToFolder]);

  // `context` is typed via `AssetsFolderContextReader`/`RuleFolderContextType`, neither of which
  // exposes `toggleFolder` at the type level: the former omits it because it's the one member that
  // isn't safely covariant across the per-entity `AssetListItem` variants (see
  // `AssetsFolderContextReader`'s own comment), and the latter's version takes `DialFile`. The `node`
  // here is always an `Asset` (the tree returns the objects it was given), so the actual runtime
  // function is reached through an `unknown` cast to a signature that matches how this component calls it.
  const onToggleFolder = useCallback(
    (node: Asset) => {
      const contextWithToggle = folderContext as unknown as
        | { toggleFolder?: (folder: Asset, skipFetch?: boolean, collapseAll?: boolean) => void }
        | undefined;
      contextWithToggle?.toggleFolder?.(node);
    },
    [folderContext],
  );

  const loadedPaths = useMemo(() => new Set(Object.keys(folderContext?.fetchedFoldersData ?? {})), [folderContext]);

  const ruleContext = folderContext as RuleFolderContextType | undefined;
  const assetsContext = folderContext as AssetsFolderContextReader<AssetListItem> | undefined;
  const isRuleFolderContext = ruleContext?.fetchFolderHierarchy != null;
  const isFetching = isRuleFolderContext
    ? ruleContext.isLoading || ruleContext.files == null
    : !!assetsContext?.isFetchingFiles;
  const showNoFolders = !isFetching && !folderData?.length;

  return (
    <div className="flex-1 size-full overflow-y-auto">
      {isFetching ? (
        <div className="flex size-full items-center justify-center">
          <DialLoader size={40} />
        </div>
      ) : showNoFolders ? (
        <DialNoDataContent title={t(EntitiesI18nKey.NoFolders)} />
      ) : (
        <DialFoldersTree
          // Admin nodes are what `toggleFolder` expects; the tree hands back the same objects it was given.
          items={folderData as unknown as FileManagerFile[]}
          expandedPaths={folderContext?.expandedFolders}
          selectedPath={folderContext?.filePath}
          loadedPaths={loadedPaths}
          areHiddenFilesVisible
          ariaLabel={t(FoldersI18nKey.Folders)}
          onItemClick={(node) => onToggleFolder(node as unknown as Asset)}
          onExpandedPathsChange={IGNORE_TREE_EXPANSION_CHANGE}
        />
      )}
    </div>
  );
};

export default FolderList;
