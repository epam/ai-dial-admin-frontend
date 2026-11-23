import { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import { DialFile as FileManagerFile, DialFoldersTree } from '@epam/ai-dial-react-file-manager';
import { Spinner, NoDataContent } from '@epam/ai-dial-ui-kit';

import UnitFolderIcon from '@/src/components/Common/UnitFolderIcon/UnitFolderIcon';
import { ROOT_FOLDER } from '@/src/constants/file';
import { EntitiesI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useOrgUnits } from '@/src/context/OrgUnitsContext';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { RuleFolderContextType } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { Asset } from '@/src/models/dial/deployment-asset';
import { useScrollSelectedFolder } from '@/src/hooks/use-scroll-selected-folder';
import { isUnitFolder } from '@/src/utils/org-units/units';

interface Props {
  disableAutoFetch?: boolean;
  initialPath?: string;
  context?: () => AssetsFolderContextReader<AssetListItem> | RuleFolderContextType;
}

const ROOT_PATH = `${ROOT_FOLDER}/`;

// Expansion is owned by the folder context (`toggleFolder` runs from `onItemClick`). A handler must
// still be passed: its presence is what makes the tree controlled, and its own toggle is discarded
// unless the context is a rule folder context, which applies caret expansion itself.
const IGNORE_TREE_EXPANSION_CHANGE = () => undefined;

const FolderList: FC<Props> = ({ context, initialPath, disableAutoFetch }) => {
  const t = useI18n();
  const folderContext = context?.();
  const hasAutoFetchedRef = useRef(false);
  const scrollToFolder = useScrollSelectedFolder();

  const folderData = folderContext?.files;

  useEffect(() => {
    const context = folderContext as RuleFolderContextType;
    if (initialPath && context?.fetchFolderHierarchy && (context?.files == null || context?.files?.length === 0)) {
      context?.fetchFolderHierarchy(initialPath, true);
      scrollToFolder();
    } else if (
      !disableAutoFetch &&
      !initialPath &&
      (folderContext?.files == null || folderContext?.files?.length === 0) &&
      !hasAutoFetchedRef.current
    ) {
      // `folderContext` changes with every fetch (in-flight flag, failure), and Next.js runs server
      // actions serially, so re-fetching on each change queues duplicates and retries a failure forever.
      hasAutoFetchedRef.current = true;
      folderContext?.fetchFiles(ROOT_PATH);
    }
  }, [folderContext, disableAutoFetch, initialPath, scrollToFolder]);

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

  const pendingPathsRef = useRef(new Set<string>());
  // A caret click or arrow key only expands or collapses: it never selects the folder, so it can't go
  // through `toggleFolder`. Newly expanded folders that have not been loaded fetch their children.
  const onRuleExpandedPathsChange = useCallback(
    (paths: Set<string>) => {
      const context = folderContext as RuleFolderContextType;
      const previousPaths = context.expandedFolders;
      context.setExpandedFolders(paths);
      paths.forEach((path) => {
        if (previousPaths.has(path) || context.fetchedFoldersData[path] != null || pendingPathsRef.current.has(path)) {
          return;
        }
        pendingPathsRef.current.add(path);
        void Promise.resolve(context.fetchFiles(path)).finally(() => pendingPathsRef.current.delete(path));
      });
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

  const { units } = useOrgUnits();
  const hasUnits = Object.keys(units).length > 0;
  const getItemIcon = useCallback(
    (node: FileManagerFile) => (isUnitFolder(units, node.path) ? <UnitFolderIcon /> : undefined),
    [units],
  );

  return (
    <div className="flex-1 size-full overflow-y-auto">
      {isFetching ? (
        <div className="flex size-full items-center justify-center">
          <Spinner size={40} fullWidth />
        </div>
      ) : showNoFolders ? (
        <NoDataContent title={t(EntitiesI18nKey.NoFolders)} />
      ) : (
        <DialFoldersTree
          // Admin nodes are what `toggleFolder` expects; the tree hands back the same objects it was given.
          items={folderData as unknown as FileManagerFile[]}
          expandedPaths={folderContext?.expandedFolders}
          selectedPath={folderContext?.filePath}
          loadedPaths={loadedPaths}
          areHiddenFilesVisible
          ariaLabel={t(FoldersI18nKey.Folders)}
          getItemIcon={hasUnits ? getItemIcon : undefined}
          onItemClick={(node) => onToggleFolder(node as unknown as Asset)}
          onExpandedPathsChange={isRuleFolderContext ? onRuleExpandedPathsChange : IGNORE_TREE_EXPANSION_CHANGE}
        />
      )}
    </div>
  );
};

export default FolderList;
