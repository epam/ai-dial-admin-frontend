import { Asset, AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialTag, FileManagerColumnKey, DialFile, NAME_COLUMN, SIZE_COLUMN } from '@epam/ai-dial-ui-kit';
import { SelectCellRendererParams } from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import { ApplicationRoute } from '@/src/types/routes';
import { FileManagerI18nKey } from '@/src/constants/i18n';
import { DialFileNodeType } from '@/src/models/dial/file';
import { enrichConversationWithVersion } from '@/src/components/Assets/BaseAssetList/utils';

export const getGridColumns = (
  view: ApplicationRoute,
  hasFoldersToDelete: boolean,
  selectedVersionsMap?: Record<string, string[]>,
) => {
  const GRID_NAME_COLUMN = {
    colId: FileManagerColumnKey.Name,
    field: 'name',
    headerName: 'Display name',
    width: 200,
  };

  const VERSION_COLUMN = {
    colId: FileManagerColumnKey.Version,
    field: 'version',
    headerName: 'Version',
    width: 200,
    autoHeight: true,
    wrapText: true,
    cellRenderer: (params: SelectCellRendererParams & { data: AssetWithVersion }) => {
      const selectedItemKey = `${params.data.folderId}${params.data.name}`;
      if (selectedVersionsMap?.[selectedItemKey]) {
        return (
          <div className="flex flex-wrap gap-1 py-1">
            {selectedVersionsMap?.[selectedItemKey]?.map((v: string) => (
              <DialTag key={`${params.data.name}__${v}`} tag={v} className="max-w-full bg-layer-4 border-0 p-2" />
            ))}
          </div>
        );
      } else if (params.data.version) {
        return (
          <div className="flex flex-wrap gap-1 py-1">
            <DialTag
              key={`${params.data.name}__${params.data.version}`}
              tag={params.data.version}
              className="max-w-full bg-layer-4 border-0 p-2"
            />
          </div>
        );
      } else {
        return null;
      }
    },
  };

  switch (view) {
    case ApplicationRoute.Prompts:
    case ApplicationRoute.AssetsApplications:
    case ApplicationRoute.AssetsToolsets:
    case ApplicationRoute.Conversations:
      return hasFoldersToDelete ? [NAME_COLUMN('Display name'), VERSION_COLUMN] : [GRID_NAME_COLUMN, VERSION_COLUMN];
    case ApplicationRoute.Files:
      return hasFoldersToDelete
        ? [NAME_COLUMN('Display name'), SIZE_COLUMN('Size')]
        : [GRID_NAME_COLUMN, SIZE_COLUMN('Size')];
    default:
      return [GRID_NAME_COLUMN];
  }
};

export const getDeleteModalTitle = (
  view: ApplicationRoute,
  t: (key: string, options?: Record<string, string | number>) => string,
  itemsCount: number,
  hasFoldersToDelete: boolean,
) => {
  if (hasFoldersToDelete) {
    return t(FileManagerI18nKey.DeleteItemsAndFoldersModalTitle);
  }

  switch (view) {
    case ApplicationRoute.Prompts:
      return t(FileManagerI18nKey.DeleteItemsModalTitle, {
        items: itemsCount > 1 ? t(FileManagerI18nKey.Prompts) : t(FileManagerI18nKey.Prompt),
      });
    case ApplicationRoute.AssetsApplications:
      return t(FileManagerI18nKey.DeleteItemsModalTitle, {
        items: itemsCount > 1 ? t(FileManagerI18nKey.Applications) : t(FileManagerI18nKey.Application),
      });
    case ApplicationRoute.AssetsToolsets:
      return t(FileManagerI18nKey.DeleteItemsModalTitle, {
        items: itemsCount > 1 ? t(FileManagerI18nKey.Toolsets) : t(FileManagerI18nKey.Toolset),
      });
    case ApplicationRoute.Files:
      return t(FileManagerI18nKey.DeleteItemsModalTitle, {
        items: itemsCount > 1 ? t(FileManagerI18nKey.Files) : t(FileManagerI18nKey.File),
      });
    case ApplicationRoute.Conversations:
      return t(FileManagerI18nKey.DeleteItemsModalTitle, {
        items: itemsCount > 1 ? t(FileManagerI18nKey.Conversations) : t(FileManagerI18nKey.Conversation),
      });
  }
};

export const getDeleteModalDescription = (
  view: ApplicationRoute,
  t: (key: string, options?: Record<string, string | number>) => string,
  itemsCount: number,
  hasFoldersToDelete: boolean,
) => {
  switch (view) {
    case ApplicationRoute.Prompts:
      return hasFoldersToDelete
        ? t(FileManagerI18nKey.DeleteItemsAndFoldersModalDescription, {
            items: t(FileManagerI18nKey.Prompts).toLowerCase(),
          })
        : t(FileManagerI18nKey.DeleteItemsModalDescription, {
            items: (itemsCount > 1 ? t(FileManagerI18nKey.Prompts) : t(FileManagerI18nKey.Prompt)).toLowerCase(),
          });
    case ApplicationRoute.AssetsApplications:
      return hasFoldersToDelete
        ? t(FileManagerI18nKey.DeleteItemsAndFoldersModalDescription, {
            items: t(FileManagerI18nKey.Applications).toLowerCase(),
          })
        : t(FileManagerI18nKey.DeleteItemsModalDescription, {
            items: (itemsCount > 1
              ? t(FileManagerI18nKey.Applications)
              : t(FileManagerI18nKey.Application)
            ).toLowerCase(),
          });
    case ApplicationRoute.AssetsToolsets:
      return hasFoldersToDelete
        ? t(FileManagerI18nKey.DeleteItemsAndFoldersModalDescription, {
            items: t(FileManagerI18nKey.Toolsets).toLowerCase(),
          })
        : t(FileManagerI18nKey.DeleteItemsModalDescription, {
            items: (itemsCount > 1 ? t(FileManagerI18nKey.Toolsets) : t(FileManagerI18nKey.Toolset)).toLowerCase(),
          });
    case ApplicationRoute.Files:
      return hasFoldersToDelete
        ? t(FileManagerI18nKey.DeleteItemsAndFoldersModalDescription, {
            items: t(FileManagerI18nKey.Files).toLowerCase(),
          })
        : t(FileManagerI18nKey.DeleteItemsModalDescription, {
            items: (itemsCount > 1 ? t(FileManagerI18nKey.Files) : t(FileManagerI18nKey.File)).toLowerCase(),
          });
    case ApplicationRoute.Conversations:
      return hasFoldersToDelete
        ? t(FileManagerI18nKey.DeleteItemsAndFoldersModalDescription, {
            items: t(FileManagerI18nKey.Conversations).toLowerCase(),
          })
        : t(FileManagerI18nKey.DeleteItemsModalDescription, {
            items: (itemsCount > 1
              ? t(FileManagerI18nKey.Conversations)
              : t(FileManagerI18nKey.Conversation)
            ).toLowerCase(),
          });
  }
};

export const normalizePath = (path: string) => {
  return path.endsWith('/') ? path : `${path}/`;
};

const getRelativePath = (originalPath: string, basePath: string) => {
  const normalized = originalPath.replace(basePath, '');
  return normalized;
};

const findOriginalItem = (items: DialFile[] | undefined, target: DialFile): DialFile | undefined => {
  if (!items) {
    return undefined;
  }

  for (const item of items) {
    if ((target.id && item.id === target.id) || item.path === target.path) {
      return item;
    }

    const nested = findOriginalItem(item.items, target);
    if (nested) {
      return nested;
    }
  }

  return undefined;
};

const createPathMappingForItem = (
  item: DialFile,
  originalPath: string,
  transformedItem: DialFile,
  mapping: Map<string, string>,
): void => {
  mapping.set(transformedItem.path, originalPath);

  if (item.items && transformedItem.items && item.items.length === transformedItem.items.length) {
    item.items.forEach((originalChild, index) => {
      const transformedChild = transformedItem.items![index];
      createPathMappingForItem(originalChild, originalChild.path, transformedChild, mapping);
    });
  }
};

const updatePathsInItem = (item: DialFile, originalItemPath: string, newParentPath: string): DialFile => {
  const relativePathPart = getRelativePath(item.path, originalItemPath);
  const newPath = `${newParentPath}${relativePathPart}`;

  return {
    ...item,
    path: newPath,
    parentPath: newParentPath,
    items: item.items?.map((child) => updatePathsInItem(child, originalItemPath, normalizePath(newPath))),
  };
};

export const generateTreeForDeletingItems = (
  items: Asset[],
  itemsToDelete: DialFile[],
  rootItemName: string,
): { treeItems: DialFile[]; pathMapping: Map<string, string> } => {
  const ROOT_PATH = `${rootItemName}/`;
  const pathMapping = new Map<string, string>();

  const rootItems = itemsToDelete.map((item) => {
    const originalItem = findOriginalItem(items as DialFile[], item) || item;
    const originalPath = originalItem.path;

    if (originalItem.nodeType === DialFileNodeType.FOLDER) {
      const folderName = originalItem.path.split('/').filter(Boolean).pop() || item.name || 'folder';
      const newFolderPath = `${ROOT_PATH}${folderName}/`;
      const updatedItem = updatePathsInItem(originalItem, normalizePath(originalItem.path), newFolderPath);

      createPathMappingForItem(originalItem, originalPath, updatedItem, pathMapping);

      return updatedItem;
    } else {
      const fileName = originalItem.name || originalItem.path.split('/').pop() || 'file';
      const newPath = `${ROOT_PATH}${fileName}`;
      pathMapping.set(newPath, originalItem.path);

      return {
        ...originalItem,
        path: newPath,
        parentPath: ROOT_PATH,
      };
    }
  });

  return {
    treeItems: [
      {
        id: 'root',
        name: rootItemName,
        path: ROOT_PATH,
        nodeType: DialFileNodeType.FOLDER,
        folderId: 'ItemsToDelete',
        items: rootItems,
      },
    ] as DialFile[],
    pathMapping,
  };
};

export const processAssetsData = (
  assets: AssetWithVersion[],
  selectedVersionsMap: Record<string, string[]>,
  view: ApplicationRoute,
): AssetWithVersion[] => {
  const processedAssets = assets.map((asset) => {
    if (asset.nodeType === DialFileNodeType.FOLDER && asset.items) {
      return { ...asset, items: processAssetsData(asset.items, selectedVersionsMap, view) };
    }
    return asset;
  });

  return processedAssets.reduce((acc: AssetWithVersion[], curr) => {
    if (curr.nodeType === DialFileNodeType.ITEM) {
      if (view === ApplicationRoute.Conversations && !curr.version) {
        curr = enrichConversationWithVersion(curr);
      }
      curr.selectedVersions = selectedVersionsMap[`${curr.folderId}${curr.name}`] || [curr.version];
      const existing = acc.find((a) => a.nodeType === DialFileNodeType.ITEM && a.name === curr.name);
      if (existing) {
        existing.path = curr.path;
        existing.version = curr.version;
        existing.selectedVersions = selectedVersionsMap[`${curr.folderId}${curr.name}`] || [curr.version];
        if (!existing.versions) existing.versions = [];
        if (!existing.versions.includes(curr.version)) {
          existing.versions.push(curr.version);
        }
      } else {
        acc.push({ ...curr, versions: [curr.version] });
      }
    } else {
      acc.push(curr);
    }
    return acc;
  }, []);
};
