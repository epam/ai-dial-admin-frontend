import { FC, useCallback, useEffect, useState } from 'react';

import { DialFileManager, DialFileNodeType, FileManagerGridRow } from '@epam/ai-dial-react-file-manager';

import { getGridOptions, getTreeOptions } from '@/src/components/Common/FileManager/utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { getFolderNameAndPath } from '@/src/utils/files/path';
import { ENTITY_SELECT_CONFIGS } from './constants';
import { EntitySelectType } from './models';

interface Props {
  entityType: EntitySelectType;
  /** The selected entity's path as its tree lists it (`<bucket>/<path>`), without the resource prefix. */
  value: string;
  isModalOpen: boolean;
  /** Single-selection mode: reports the one selected entity, or `null` when nothing selectable is. */
  onChangeSelectedPath?: (path: string | null) => void;
  /** Multi-selection mode (takes precedence): reports every selected entity, never a grouping folder. */
  onChangeSelectedPaths?: (paths: string[]) => void;
}

const EntitySelectManager: FC<Props> = ({
  entityType,
  value,
  isModalOpen,
  onChangeSelectedPath,
  onChangeSelectedPaths,
}) => {
  const isMultiple = onChangeSelectedPaths != null;
  const { route, gridColumns, useFolder } = ENTITY_SELECT_CONFIGS[entityType];
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const {
    files,
    fetchFiles,
    fetchFolderHierarchy,
    isFetchingFiles,
    filePath,
    setFilePath,
    expandedFolders,
    setExpandedFolders,
    fetchedFoldersData,
  } = useFolder();

  const [loadedPaths, setLoadedPaths] = useState(new Set<string>());
  // The value that turned out to point at nothing: the picker opens at the root for it, like it has no value.
  // Keyed by the value, so a different value is resolved afresh without waiting for the popup to reopen.
  const [unresolvedValue, setUnresolvedValue] = useState<string | null>(null);
  const isValueUnresolved = unresolvedValue === value;
  const effectiveValue = isValueUnresolved ? '' : value;

  useEffect(() => {
    if ((files == null || files.length === 0) && isModalOpen) {
      if (effectiveValue) {
        const path = getFolderNameAndPath(effectiveValue).path;
        // A missing folder leaves `files` empty, which re-runs this effect. Its listing is already known, so
        // asking again would only repeat the failing request before the fallback below takes over.
        if (fetchedFoldersData?.[`${path}/`] == null) {
          fetchFolderHierarchy?.(`${path}/`, true);
        }
      } else {
        fetchFiles(`${ROOT_FOLDER}/`);
        setLoadedPaths(new Set([`${ROOT_FOLDER}/`]));
      }
    }
    // `fetchedFoldersData` is read in the guard above but must not be a trigger: every cache update would
    // restart the load sequence. The same goes for the other values read here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, isModalOpen]);

  useEffect(() => {
    if (effectiveValue && files !== null && files.length > 0 && isModalOpen) {
      const path = getFolderNameAndPath(effectiveValue).path;
      fetchFolderHierarchy?.(`${path}/`, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveValue, isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) {
      setUnresolvedValue(null);
      return;
    }
    if (!value || isValueUnresolved) {
      return;
    }
    // A value without a folder (no `/`) has no listing to look up.
    const folderPath = getFolderNameAndPath(value).path;
    if (!folderPath) {
      return;
    }
    // A missing folder lists as empty rather than failing (the backend's 400 is swallowed upstream).
    const isLeafEmpty = fetchedFoldersData?.[`${folderPath}/`]?.length === 0;
    if (isLeafEmpty) {
      setUnresolvedValue(value);
      // The array form replaces the tree outright, dropping the placeholder folders of the missing path.
      fetchFiles([`${ROOT_FOLDER}/`], true, true);
      setLoadedPaths(new Set([`${ROOT_FOLDER}/`]));
    }
  }, [value, isValueUnresolved, fetchedFoldersData, isModalOpen, fetchFiles]);

  const onPathChange = useCallback(
    (nextPath: string | undefined) => {
      if (!nextPath) {
        return;
      }
      const newExpanded = new Set(expandedFolders);

      if (newExpanded.has(nextPath)) {
        newExpanded.delete(nextPath);
      } else {
        newExpanded.add(nextPath);
      }
      if (!loadedPaths.has(nextPath)) {
        fetchFiles(nextPath);
      }
      setFilePath(nextPath);
      setLoadedPaths((prev) => new Set(prev).add(nextPath));
      setExpandedFolders(newExpanded);
    },
    [expandedFolders, fetchFiles, loadedPaths, setExpandedFolders, setFilePath],
  );

  const onFolderPopupPathChange = useCallback(
    (nextPath: string | undefined) => {
      if (nextPath && !loadedPaths.has(nextPath)) {
        setLoadedPaths((prev) => new Set(prev).add(nextPath));
        fetchFiles(nextPath);
      }
    },
    [loadedPaths, fetchFiles],
  );

  // A grouping folder is browsable but never a choice, so only an entity row (an ITEM) is reported.
  const onSelectEntity = useCallback(
    (rows: FileManagerGridRow[]) => {
      if (onChangeSelectedPaths) {
        onChangeSelectedPaths(rows.filter((row) => row.nodeType === DialFileNodeType.ITEM).map((row) => row.path));
        return;
      }
      const row = rows[0];
      onChangeSelectedPath?.(row?.nodeType === DialFileNodeType.ITEM ? row.path : null);
    },
    [onChangeSelectedPath, onChangeSelectedPaths],
  );

  return (
    <div className="size-full min-h-0">
      <DialFileManager
        className="p-0 gap-0 bg-layer-3 !grid-rows-1"
        gridClassName="p-3"
        // Library always mounts a h-[64px] content-header row; hide it when breadcrumb/toolbar are unused.
        contentHeaderClassName="hidden"
        contentClassName="!px-3 !gap-0 !pb-0"
        path={filePath}
        items={files as []}
        filesLoading={isFetchingFiles}
        showNavigationPanel={false}
        navigationPanelOptions={{ searchable: false }}
        sortOptions={{ sortable: false }}
        treeOptions={getTreeOptions(
          isReadOnlyAdmin,
          isFetchingFiles,
          effectiveValue ? expandedFolders : loadedPaths,
          expandedFolders,
          route,
          setExpandedFolders,
          t,
        )}
        defaultSelectedPaths={effectiveValue ? new Set([effectiveValue]) : void 0}
        gridOptions={getGridOptions(route, isReadOnlyAdmin, gridColumns, t, !isMultiple)}
        onPathChange={onPathChange}
        onFolderPopupPathChange={onFolderPopupPathChange}
        handleSelectionClick={onSelectEntity}
      />
    </div>
  );
};

export default EntitySelectManager;
