import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialEllipsisTooltip, DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { IconCaretDownFilled, IconCaretRightFilled, IconDotsVertical, IconFolder, IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';

import ActionsDropdown from '@/src/components/Common/ActionsDropdown/ActionsDropdown';
import {
  getAddChildOperation,
  getAddSiblingOperation,
  getDeleteFolderOperation,
  getManageFolderOperation,
  getMoveFolderOperation,
  getRenameFolderOperation,
} from '@/src/components/Common/FolderCreate/Components/Operations';
import { ROOT_FOLDER } from '@/src/constants/file';
import { EntitiesI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { RuleFolderContextType } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { Asset, AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { DialFolder } from '@/src/models/dial/folder';
import { ApplicationRoute } from '@/src/types/routes';
import { getFolderName } from '@/src/utils/files/folder';
import { getFolderNameAndPath, isFolder } from '@/src/utils/files/path';
import { isAssetView } from '@/src/utils/is-asset-view';
import { addTrailingSlash } from '@/src/utils/url';
import FolderListModals, { ModalType } from './Modals/FolderListModals';
import { generateFolderListFromBulkPaths } from './utils';

interface Props {
  disableAutoFetch?: boolean;
  initialPath?: string;
  view?: ApplicationRoute;
  context?: () => AssetsFolderContext | RuleFolderContextType;
  isFolderMove?: boolean;
  folderPath?: string;
  isFolderDelete?: boolean;
  isBulkDelete?: boolean;
}

const FolderList: FC<Props> = ({
  context,
  initialPath,
  view,
  disableAutoFetch,
  isFolderMove,
  folderPath,
  isFolderDelete,
  isBulkDelete,
}) => {
  const t = useI18n();
  const folderContext = context?.();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType | undefined>(void 0);

  const [selectedFolder, setSelectedFolder] = useState<string>();

  const folderData = useMemo(() => {
    return isBulkDelete
      ? generateFolderListFromBulkPaths(Object.keys((folderContext as AssetsFolderContext)?.bulkSelectedData) || [])
      : folderContext?.files;
  }, [folderContext, isBulkDelete]);

  const rootFolder = useMemo(() => {
    return isFolderDelete && !isBulkDelete ? initialPath : void 0;
  }, [initialPath, isBulkDelete, isFolderDelete]);

  const showFolderActions = isAssetView(view);

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
    return node.name === ROOT_FOLDER ? [] : items;
  };

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setModalType(void 0);
  }, []);

  const handleModalOpen = useCallback((modalType: ModalType) => {
    setModalType(modalType);
    setIsModalOpen(true);
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
        folderContext.toggleFolder(node as AssetWithVersion);
      }
      setSelectedFolder(node.path);
      handleModalOpen(ModalType.move);
    },
    [folderContext, handleModalOpen],
  );

  const openDeleteFolderModalState = useCallback(
    (node: DialFolder) => {
      folderContext?.toggleFolder(node as AssetWithVersion);
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
      !isBulkDelete &&
      (folderContext?.files == null || folderContext?.files?.length === 0)
    ) {
      folderContext?.fetchFiles(`${ROOT_FOLDER}/`);
    }
  }, [folderContext, disableAutoFetch, initialPath, isBulkDelete]);

  const getFolderClassName = (node: DialFile, level: number) => {
    const isSelected = folderContext?.filePath === node.path;
    const baseClassName = `flex justify-between pl-${level * 5}`;
    const selectedClassName = isSelected
      ? 'bg-accent-primary-alpha border-l-2 border-l-accent-primary rounded'
      : 'border-l-2 border-l-transparent';
    const iconClassName =
      !node.items?.some((c) => isFolder(c.nodeType)) &&
      (isBulkDelete
        ? (folderContext as AssetsFolderContext)?.bulkSelectedData[node.path]
        : folderContext?.fetchedFoldersData[node.path])
        ? 'text-transparent'
        : '';
    return { baseClassName, selectedClassName, iconClassName };
  };

  const renderTree = (nodes: Asset[] | undefined, level: number, rootFolderPath?: string) => {
    if (rootFolderPath) {
      const findRootNode = (nodes: Asset[]): Asset | null => {
        for (const node of nodes) {
          if (node.path === rootFolderPath) {
            return node;
          }
          if (node.items) {
            const found = findRootNode(node.items);
            if (found) return found;
          }
        }
        return null;
      };

      const rootNode = findRootNode(nodes || []);
      if (!rootNode) return null;
      return renderTree([rootNode], level);
    }

    return nodes?.map((node) => {
      const { path, nodeType, items, name } = node;
      const { baseClassName, selectedClassName, iconClassName } = getFolderClassName(node, level);
      const isExpanded = folderContext?.expandedFolders.has(path);
      const isMoveError =
        isFolderMove &&
        path === folderContext?.filePath &&
        items?.some((c) => getFolderName(c.path) === getFolderName(folderPath || ''));
      const isMovableFolder = isFolderMove && folderPath === path;

      return (
        <div key={path} className="small-medium cursor-pointer text-secondary">
          {isFolder(nodeType) && (
            <div className="flex flex-col">
              <div
                className={classNames(
                  'group py-2',
                  baseClassName,
                  selectedClassName,
                  isMovableFolder && 'pointer-events-none',
                  isMoveError && 'bg-error border-l-error',
                )}
              >
                <div
                  className="flex-1 flex flex-row truncate"
                  onClick={() => folderContext?.toggleFolder(node as AssetWithVersion)}
                >
                  <div className={classNames(iconClassName, 'flex items-center justify-center')}>
                    {isExpanded ? (
                      <IconCaretDownFilled
                        {...BASE_BUTTON_ICON_PROPS}
                        widths={10}
                        height={10}
                        className="flex-shrink-0"
                      />
                    ) : (
                      <IconCaretRightFilled
                        {...BASE_BUTTON_ICON_PROPS}
                        widths={10}
                        height={10}
                        className="flex-shrink-0"
                      />
                    )}
                  </div>
                  <IconFolder
                    {...BASE_BUTTON_ICON_PROPS}
                    className={classNames(
                      'flex-shrink-0 mr-2',
                      isMoveError && 'text-error',
                      isMovableFolder || isFolderDelete ? 'text-accent-primary' : '',
                    )}
                  />
                  <DialEllipsisTooltip text={name} className="text-primary" />
                </div>

                {showFolderActions && (
                  <div className="invisible group-hover:visible text-primary mx-2 flex flex-row gap-2">
                    {isAssetView(view) && (
                      <ActionsDropdown
                        items={folderCreateItems(node)}
                        icon={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
                      />
                    )}
                    <ActionsDropdown
                      items={folderManageItems(node)}
                      icon={<IconDotsVertical {...BASE_BUTTON_ICON_PROPS} />}
                    />
                  </div>
                )}
              </div>

              {isMoveError && (
                <div className={classNames(baseClassName, 'tiny text-error')}>
                  <span className="pl-11">{t(FoldersI18nKey.MoveFolderError)}</span>
                </div>
              )}
            </div>
          )}

          {isExpanded && items && <div key={`${path}-children`}>{renderTree(items, level + 1)}</div>}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto">
      {!folderContext?.files?.length && !isBulkDelete ? (
        <DialNoDataContent title={t(EntitiesI18nKey.NoFolders)} />
      ) : (
        renderTree(folderData, 0, rootFolder)
      )}
      <FolderListModals
        view={view}
        isModalOpen={isModalOpen}
        modalType={modalType}
        selectedFolder={selectedFolder}
        context={context as () => AssetsFolderContext}
        handleClose={handleModalClose}
      />
    </div>
  );
};

export default FolderList;
