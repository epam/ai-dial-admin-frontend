import { FC, useCallback, useEffect, useState } from 'react';

import { DialFileManager, DialFileNodeType, FileManagerGridRow } from '@epam/ai-dial-react-file-manager';

import { getGridOptions, getTreeOptions } from '@/src/components/Common/FileManager/utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { useSkillFolder } from '@/src/context/assets/SkillFolderContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { getFolderNameAndPath } from '@/src/utils/files/path';
import { SKILL_SELECT_GRID_COLUMNS } from './constants';

interface Props {
  /** The selected skill's path as the Skills tree lists it (`<bucket>/<path>`), without the `skills/` prefix. */
  value: string;
  isModalOpen: boolean;
  onChangeSelectedSkillPath: (skillPath: string | null) => void;
}

const SkillManager: FC<Props> = ({ value, isModalOpen, onChangeSelectedSkillPath }) => {
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
  } = useSkillFolder();

  const [loadedPaths, setLoadedPaths] = useState(new Set<string>());

  useEffect(() => {
    if ((files == null || files.length === 0) && isModalOpen) {
      if (value) {
        const path = getFolderNameAndPath(value).path;
        fetchFolderHierarchy?.(`${path}/`, true);
      } else {
        fetchFiles(`${ROOT_FOLDER}/`);
        setLoadedPaths(new Set([`${ROOT_FOLDER}/`]));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, isModalOpen]);

  useEffect(() => {
    if (value && files !== null && files.length > 0 && isModalOpen) {
      const path = getFolderNameAndPath(value).path;
      fetchFolderHierarchy?.(`${path}/`, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isModalOpen]);

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

  // A grouping folder is browsable but never a choice, so only a skill row (an ITEM) is reported.
  const onSelectSkill = useCallback(
    (rows: FileManagerGridRow[]) => {
      const row = rows[0];
      onChangeSelectedSkillPath(row?.nodeType === DialFileNodeType.ITEM ? row.path : null);
    },
    [onChangeSelectedSkillPath],
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
          value ? expandedFolders : loadedPaths,
          expandedFolders,
          ApplicationRoute.Skills,
          setExpandedFolders,
          t,
        )}
        defaultSelectedPaths={value ? new Set([value]) : void 0}
        gridOptions={getGridOptions(ApplicationRoute.Skills, isReadOnlyAdmin, SKILL_SELECT_GRID_COLUMNS, t, true)}
        onPathChange={onPathChange}
        onFolderPopupPathChange={onFolderPopupPathChange}
        handleSelectionClick={onSelectSkill}
      />
    </div>
  );
};

export default SkillManager;
