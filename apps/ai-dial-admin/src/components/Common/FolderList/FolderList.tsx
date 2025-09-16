import { FC, useCallback, useEffect, useState } from 'react';

import { IconCaretDownFilled, IconCaretRightFilled, IconDotsVertical, IconFolder, IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';

import FolderActions from '@/src/components/Common/FolderCreate/Components/FolderActions';
import {
  getAddChildOperation,
  getAddSiblingOperation,
  getDeleteFolderOperation,
  getManageFolderOperation,
  getMoveFolderOperation,
  getRenameFolderOperation,
} from '@/src/components/Common/FolderCreate/utils';
import NoDataContent from '@/src/components/Common/NoData/NoData';
import Tooltip from '@/src/components/Common/Tooltip/Tooltip';
import { ROOT_FOLDER } from '@/src/constants/file';
import { EntitiesI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { FileFolderContextType } from '@/src/context/FileFolderContext';
import { PromptFolderContextType } from '@/src/context/PromptFolderContext';
import { RuleFolderContextType } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { DialFolder } from '@/src/models/dial/folder';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { getFolderName } from '@/src/utils/files/folder';
import { addTrailingSlash, getFolderNameAndPath, isFolder } from '@/src/utils/files/path';
import FolderListModals, { ModalType } from './Modals/FolderListModals';

interface Props {
  disableAutoFetch?: boolean;
  initialPath?: string;
  view?: ApplicationRoute;
  context?: () => PromptFolderContextType | FileFolderContextType | RuleFolderContextType;
  isFolderMove?: boolean;
  folderPath?: string;
  isFolderDelete?: boolean;
}

const FolderList: FC<Props> = ({
  context,
  initialPath,
  view,
  disableAutoFetch,
  isFolderMove,
  folderPath,
  isFolderDelete,
}) => {
  const t = useI18n();
  const folderContext = context?.();

  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [modalType, setModalType] = useState<ModalType | undefined>(void 0);

  const [selectedFolder, setSelectedFolder] = useState<string>();

  const showFolderActions = view === ApplicationRoute.Prompts;

  const folderCreateItems = (node: DialFolder) => {
    const items = [
      getAddSiblingOperation(() => openCreateFolderModal(addTrailingSlash(getFolderNameAndPath(node.path).path))),
      getAddChildOperation(() => openCreateFolderModal(node.path)),
    ];
    return node.name === ROOT_FOLDER ? [items[1]] : items;
  };

  const folderManageItems = (node: DialFolder) => {
    const items = [
      getRenameFolderOperation(() => openRenameFolderModal(node.path)),
      getMoveFolderOperation(() => openMoveFolderModal(node)),
      getManageFolderOperation(() => openFolderStorage(node.path)),
      getDeleteFolderOperation(() => openDeleteFolderModalState(node)),
    ];
    return node.name === ROOT_FOLDER ? [items[2]] : items;
  };

  const handleModalClose = useCallback(() => {
    setModalState(PopUpState.Closed);
    setModalType(void 0);
  }, []);

  const handleModalOpen = useCallback((modalType: ModalType) => {
    setModalType(modalType);
    setModalState(PopUpState.Opened);
  }, []);

  const openFolderStorage = (path: string) => {
    window.open(`${ApplicationRoute.FoldersStorage}?path=${encodeURIComponent(path)}`, '_blank');
  };

  const openCreateFolderModal = useCallback(
    (path: string) => {
      setSelectedFolder(path);
      handleModalOpen(ModalType.create);
    },
    [handleModalOpen],
  );

  const openRenameFolderModal = useCallback(
    (path: string) => {
      setSelectedFolder(path);
      handleModalOpen(ModalType.rename);
    },
    [handleModalOpen],
  );

  const openMoveFolderModal = useCallback(
    (node: DialFolder) => {
      if (folderContext?.expandedFolders.has(node.path)) {
        folderContext.toggleFolder(node);
      }
      setSelectedFolder(node.path);
      handleModalOpen(ModalType.move);
    },
    [folderContext, handleModalOpen],
  );

  const openDeleteFolderModalState = useCallback(
    (node: DialFolder) => {
      folderContext?.toggleFolder(node);
      setSelectedFolder(node.path);
      handleModalOpen(ModalType.delete);
    },
    [folderContext, handleModalOpen],
  );

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
    const baseClass = `flex justify-between pl-${level * 5}`;
    const selectedClass = isSelected
      ? 'bg-accent-primary-alpha border-l-2 border-l-accent-primary rounded'
      : 'border-l-2 border-l-transparent';
    const iconClass =
      !node.children?.some((c) => isFolder(c.nodeType)) && folderContext?.fetchedFoldersData[node.path]
        ? 'text-transparent'
        : '';
    return { baseClass, selectedClass, iconClass };
  };

  const renderTree = (nodes: DialFile[], level: number, rootFolderPath?: string) => {
    if (rootFolderPath) {
      const findRootNode = (nodes: DialFile[]): DialFile | null => {
        for (const node of nodes) {
          if (node.path === rootFolderPath) {
            return node;
          }
          if (node.children) {
            const found = findRootNode(node.children);
            if (found) return found;
          }
        }
        return null;
      };

      const rootNode = findRootNode(nodes);
      if (!rootNode) return null;
      return renderTree([rootNode], level);
    }

    return nodes?.map((node) => {
      const { path, nodeType, children, name } = node;
      const { baseClass, selectedClass, iconClass } = getFolderClassNames(node, level);
      const isExpanded = folderContext?.expandedFolders.has(path);
      const isMoveError =
        isFolderMove &&
        path === folderContext?.filePath &&
        children?.some((c) => getFolderName(c.path) === getFolderName(folderPath || ''));
      const isMovableFolder = isFolderMove && folderPath === path;

      return (
        <div key={path} className="small-medium cursor-pointer text-secondary">
          {isFolder(nodeType) && (
            <div className="flex flex-col">
              <div
                className={`group ${baseClass} ${selectedClass} ${isMovableFolder && 'pointer-events-none'} ${isMoveError ? 'bg-error border-l-error' : ''} py-2`}
              >
                <div className="flex-1 flex flex-row truncate" onClick={() => folderContext?.toggleFolder(node)}>
                  <div className={classNames(iconClass, 'flex items-center justify-center')}>
                    {isExpanded ? (
                      <IconCaretDownFilled {...BASE_ICON_PROPS} widths={10} height={10} className="flex-shrink-0" />
                    ) : (
                      <IconCaretRightFilled {...BASE_ICON_PROPS} widths={10} height={10} className="flex-shrink-0" />
                    )}
                  </div>
                  <IconFolder
                    {...BASE_ICON_PROPS}
                    className={classNames(
                      'flex-shrink-0',
                      isMoveError ? 'text-error' : '',
                      isMovableFolder || isFolderDelete ? 'text-accent-primary' : '',
                    )}
                  />
                  <Tooltip tooltip={name}>
                    <span className="pl-2 text-primary truncate">{name}</span>
                  </Tooltip>
                </div>

                {showFolderActions && (
                  <div className="invisible group-hover:visible text-primary mx-2 flex flex-row gap-2">
                    <FolderActions items={folderCreateItems(node)} icon={<IconPlus {...BASE_ICON_PROPS} />} />
                    <FolderActions items={folderManageItems(node)} icon={<IconDotsVertical {...BASE_ICON_PROPS} />} />
                  </div>
                )}
              </div>

              {isMoveError && (
                <div className={`${baseClass} tiny text-error`}>
                  <span className="pl-11">{t(FoldersI18nKey.MoveFolderError)}</span>
                </div>
              )}
            </div>
          )}

          {isExpanded && children && <div key={`${path}-children`}>{renderTree(children, level + 1)}</div>}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 w-full overflow-y-auto">
      {!folderContext?.files?.length ? (
        <NoDataContent emptyDataTitle={t(EntitiesI18nKey.NoFolders)} />
      ) : (
        renderTree(folderContext?.files, 0, isFolderDelete ? initialPath : void 0)
      )}
      <FolderListModals
        view={view}
        modalState={modalState}
        modalType={modalType}
        selectedFolder={selectedFolder}
        context={context}
        handleClose={handleModalClose}
      />
    </div>
  );
};

export default FolderList;
