import { FC, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { IconCaretDownFilled, IconCaretRightFilled, IconDotsVertical, IconFolder, IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';

import { createFolderWithFiles } from '@/src/app/[lang]/folders-storage/actions';
import FolderActions from '@/src/components/Common/FolderCreate/Components/FolderActions';
import FolderCreateModal from '@/src/components/Common/FolderCreate/Components/FolderCreateModal';
import {
  getAddChildOperation,
  getAddSiblingOperation,
  getManageFolderOperation,
} from '@/src/components/Common/FolderCreate/utils';
import NoDataContent from '@/src/components/Common/NoData/NoData';
import { getFormDataForImport } from '@/src/components/EntityListView/HeaderButtons/EntityListHeaderButtons.utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { EntitiesI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { FileFolderContextType } from '@/src/context/FileFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { PromptFolderContextType } from '@/src/context/PromptFolderContext';
import { RuleFolderContextType } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { DialFolder } from '@/src/models/dial/folder';
import { DialRule } from '@/src/models/dial/rule';
import { ParsedPrompts } from '@/src/models/prompts';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { addTrailingSlash, getFolderNameAndPath, isFolder } from '@/src/utils/files/path';
import { getSuccessNotification } from '@/src/utils/notification';

interface Props {
  disableAutoFetch?: boolean;
  initialPath?: string;
  view?: ApplicationRoute;
  context?: () => PromptFolderContextType | FileFolderContextType | RuleFolderContextType;
}

const FolderList: FC<Props> = ({ context, initialPath, view, disableAutoFetch }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const folderContext = context?.();
  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [selectedFolder, setSelectedFolder] = useState<string>();

  const showFolderActions = view === ApplicationRoute.Prompts;

  const openModal = (path: string) => {
    setSelectedFolder(path);
    setModalState(PopUpState.Opened);
  };

  const onCloseModal = useCallback(() => {
    setModalState(PopUpState.Closed);
  }, [setModalState]);

  const openFolderStorage = (path: string) => {
    window.open(`${ApplicationRoute.FoldersStorage}?path=${encodeURIComponent(path)}`, '_blank');
  };

  const folderCreateItems = (node: DialFolder) => {
    const items = [
      getAddSiblingOperation(() => openModal(addTrailingSlash(getFolderNameAndPath(node.path).path))),
      getAddChildOperation(() => openModal(node.path)),
    ];
    return node.name === ROOT_FOLDER ? [items[1]] : items;
  };

  const folderManageItems = (node: DialFolder) => {
    return [getManageFolderOperation(() => openFolderStorage(node.path))];
  };

  useEffect(() => {
    const context = folderContext as RuleFolderContextType;
    if (initialPath && context?.fetchFolderHierarchy && (context?.files == null || context?.files?.length === 0)) {
      context?.fetchFolderHierarchy(initialPath, true);
    } else if (
      !disableAutoFetch &&
      !initialPath &&
      (folderContext?.files == null || folderContext?.files?.length === 0)
    ) {
      folderContext?.fetchFiles(`${ROOT_FOLDER}/`);
    }
  }, [folderContext, disableAutoFetch, initialPath]);

  const getFolderClassNames = (node: DialFile, level: number) => {
    const isSelected = folderContext?.filePath === node.path;
    const baseClass = `group flex justify-between py-2 pl-${level * 5}`;
    const selectedClass = isSelected
      ? 'bg-accent-primary-alpha border-l-2 border-l-accent-primary rounded'
      : 'border-l-2 border-l-transparent';
    const iconClass =
      !node.children?.some((c) => isFolder(c.nodeType)) && folderContext?.fetchedFoldersData[node.path]
        ? 'text-transparent'
        : '';

    return {
      baseClass,
      selectedClass,
      iconClass,
    };
  };

  const createFolder = useCallback(
    (fileType: ImportFileType, file: File | File[] | ParsedPrompts, rules: DialRule[], path: string) => {
      const body = getFormDataForImport(path, file, fileType, ConflictResolutionPolicy.SKIP, rules);

      createFolderWithFiles(body, fileType).then((res) => {
        if (res.success) {
          folderContext?.fetchFiles(`${addTrailingSlash(getFolderNameAndPath(path).path)}`);
          showNotification(getSuccessNotification(t(FoldersI18nKey.FolderCreateSuccess)));
        }
      });
      onCloseModal();
    },
    [onCloseModal, folderContext, showNotification, t],
  );

  const renderTree = (nodes: DialFile[], level: number) => {
    return nodes?.map((node) => {
      const { path, nodeType, children, name } = node;
      const { baseClass, selectedClass, iconClass } = getFolderClassNames(node, level);

      return (
        <div key={path} className="small-medium cursor-pointer text-secondary">
          {isFolder(nodeType) && (
            <div className={`${baseClass} ${selectedClass}`}>
              <div className="flex-1 flex flex-row" onClick={() => folderContext?.toggleFolder(node)}>
                <div className={classNames(iconClass, 'flex items-center justify-center')}>
                  {folderContext?.expandedFolders.has(path) ? (
                    <IconCaretDownFilled {...BASE_ICON_PROPS} widths={10} height={10} />
                  ) : (
                    <IconCaretRightFilled {...BASE_ICON_PROPS} widths={10} height={10} />
                  )}
                </div>
                <IconFolder {...BASE_ICON_PROPS} />
                <span className="pl-2 text-primary">{name}</span>
              </div>
              {showFolderActions && (
                <div className="invisible group-hover:visible text-primary mx-2 flex flex-row gap-2">
                  <FolderActions items={folderCreateItems(node)} icon={<IconPlus {...BASE_ICON_PROPS} />} />
                  <FolderActions items={folderManageItems(node)} icon={<IconDotsVertical {...BASE_ICON_PROPS} />} />
                </div>
              )}
            </div>
          )}
          {folderContext?.expandedFolders.has(path) && children && (
            <div key={`${path}-children`}>{renderTree(children, level + 1)}</div>
          )}
        </div>
      );
    });
  };
  return (
    <div className="flex-1 w-full overflow-y-auto" data-testid={'folder-list'}>
      {!folderContext?.files?.length ? (
        <NoDataContent emptyDataTitle={t(EntitiesI18nKey.NoFolders)} />
      ) : (
        renderTree(folderContext?.files, 0)
      )}
      {modalState === PopUpState.Opened &&
        createPortal(
          <FolderCreateModal
            view={view}
            folderPath={selectedFolder}
            modalState={modalState}
            onClose={onCloseModal}
            onApply={createFolder}
          />,
          document.body,
        )}
    </div>
  );
};

export default FolderList;
