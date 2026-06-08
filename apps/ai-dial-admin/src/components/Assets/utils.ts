import { ImageVersion } from '@/src/models/deployments/images';
import { AssetApp, AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { compareVersions, modifyNameVersionInAsset } from '@/src/utils/entities/versions';
import { ApplicationRoute } from '@/src/types/routes';
import { allActionLabels, baseToolbarOptionLabels } from './constants';
import { ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';
import { ImportFileType } from '@/src/types/import';
import { DialCopiedItem, DialDeletedItem, DialFile, DialFileNodeType } from '@epam/ai-dial-ui-kit';

export const getAgentLinkForConversation = (
  deployment: Record<string, string> | null,
  currentLocale: string,
): string => {
  let path = '';

  if (deployment?.model) {
    path = `/${currentLocale}${ApplicationRoute.Models}/${encodeURIComponent(deployment.model)}`;
  } else if (deployment?.application) {
    if (deployment.application === deployment.reference) {
      path = `/${currentLocale}${ApplicationRoute.Applications}/${encodeURIComponent(deployment.application)}`;
    } else {
      path = `/${currentLocale}${ApplicationRoute.AssetsApplications}/${encodeURIComponent(deployment.displayName)}?path=${deployment.application.replace('applications/', '')}`;
    }
  }
  return path;
};

export const filterLatestVersions = (data: AssetWithVersion[]) => {
  const latestVersions: Record<string, AssetWithVersion> = {};

  data?.forEach((item) => {
    const name = item.name as string;
    if (!latestVersions[name] || compareVersions(item.version, latestVersions[name].version) > 0) {
      latestVersions[name] = item as AssetWithVersion;
    }
  });

  return Object.values(latestVersions);
};

export const getVersionsPerName = (data: AssetWithVersion[] | ImageVersion[]) => {
  const versionsPerName: Record<string, string[]> = {};

  data.forEach((item) => {
    const name = item.name as string;

    if (!versionsPerName[name]) {
      versionsPerName[name] = [];
    }
    versionsPerName[name].push(item.version);
  });

  Object.keys(versionsPerName).forEach((key) => {
    versionsPerName[key] = versionsPerName[key].sort(compareVersions);
  });

  return versionsPerName;
};

export const getIsNeedToMove = (entity: AssetWithVersion, initialEntity?: AssetWithVersion) => {
  return entity.folderId !== initialEntity?.folderId;
};

export const getEntityForUpdate = (entity: AssetWithVersion, initialEntity?: AssetWithVersion) => {
  return {
    ...entity,
    folderId: (initialEntity as AssetWithVersion)?.folderId,
  };
};

export const addNewVersion = (entity: AssetWithVersion, version: string) => {
  const path = modifyNameVersionInAsset(entity.path, void 0, version);
  delete (entity as AssetApp).reference;
  return {
    ...entity,
    path,
    version,
  };
};

export const getParentPathByFullPath = (fullPath: string) => {
  let normalized = fullPath.endsWith('/') && fullPath !== '/' ? fullPath.slice(0, -1) : fullPath;
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash === -1) return '';

  return normalized.slice(0, lastSlash + 1);
};

export const getGridActionLabels = (view: ApplicationRoute, isReadOnlyAdmin: boolean) => {
  switch (view) {
    case ApplicationRoute.Files:
      return isReadOnlyAdmin
        ? []
        : allActionLabels.filter((item) => item.key !== 'duplicate' && item.key !== 'openInNewTab');
    case ApplicationRoute.AssetsApplications:
    case ApplicationRoute.AssetsToolsets:
    case ApplicationRoute.Prompts:
      return isReadOnlyAdmin ? [] : allActionLabels.filter((item) => item.key !== 'preview');
    case ApplicationRoute.Conversations:
      return isReadOnlyAdmin
        ? []
        : allActionLabels.filter((item) => item.key === 'delete' || item.key === 'openInNewTab');
    default:
      return [];
  }
};

export const getTreeActionLabels = (isReadOnlyAdmin: boolean, view: ApplicationRoute) => {
  if (view === ApplicationRoute.Conversations) {
    return isReadOnlyAdmin ? [] : allActionLabels.filter((item) => item.key === 'delete');
  }

  return isReadOnlyAdmin
    ? []
    : allActionLabels.filter(
        (item) => item.key !== 'duplicate' && item.key !== 'preview' && item.key !== 'openInNewTab',
      );
};

export const getToolbarOptionLabels = (view: ApplicationRoute, isReadOnlyAdmin: boolean) => {
  if (isReadOnlyAdmin) return [];

  switch (view) {
    case ApplicationRoute.Files:
      return [...baseToolbarOptionLabels, { key: 'uploadFiles', label: FileManagerI18nKey.Files, icon: null }];
    case ApplicationRoute.AssetsApplications:
      return [
        ...baseToolbarOptionLabels,
        {
          key: 'newItem',
          label: FileManagerI18nKey.Application,
          icon: null,
        },
        {
          key: 'uploadFiles',
          label: ButtonsI18nKey.Import,
          icon: null,
        },
      ];
    case ApplicationRoute.AssetsToolsets:
      return [
        ...baseToolbarOptionLabels,
        {
          key: 'newItem',
          label: FileManagerI18nKey.Toolset,
          icon: null,
        },
        {
          key: 'uploadFiles',
          label: ButtonsI18nKey.Import,
          icon: null,
        },
      ];
    case ApplicationRoute.Prompts:
      return [
        ...baseToolbarOptionLabels,
        {
          key: 'newItem',
          label: FileManagerI18nKey.Prompt,
          icon: null,
        },
        {
          key: 'uploadFiles',
          label: ButtonsI18nKey.Import,
          icon: null,
        },
      ];
    default:
      return [];
  }
};

export const getDeleteNotificationContent = (
  view: ApplicationRoute,
  fileNodes: DialDeletedItem[] | DialFile[] | AssetWithVersion[],
  t: (key: string, options?: Record<string, string | number>) => string,
  destinationFolder?: string,
) => {
  const deletedItemsCount = fileNodes.reduce((count, item) => {
    const itemCount =
      item.nodeType === DialFileNodeType.ITEM ? (item as AssetWithVersion)?.selectedVersions?.length || 1 : 1;
    return count + itemCount;
  }, 0);

  const isDeleteSeveralFiles = deletedItemsCount > 1;
  const isDeleteFolder =
    fileNodes.length === 1 && (fileNodes[0] as DialDeletedItem).nodeType === DialFileNodeType.FOLDER;

  if (isDeleteFolder) {
    const title = t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Folder) });
    const description = t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
      item: t(FileManagerI18nKey.Folder),
      name: (fileNodes as DialDeletedItem[])[0]?.sourceUrl || (fileNodes as DialFile[])[0]?.path,
    });
    return { title, description };
  }

  switch (view) {
    case ApplicationRoute.Conversations: {
      const title = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Items) })
        : t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Conversation) });
      const description = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessDescriptionForMany, {
            count: deletedItemsCount,
          })
        : t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.Prompt),
            name: (fileNodes as DialFile[])?.[0].name || '',
            path: destinationFolder || '/',
          });
      return { title, description };
    }
    case ApplicationRoute.Files: {
      const title = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Items) })
        : t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.File) });
      const description = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessDescriptionForMany, {
            count: deletedItemsCount,
          })
        : t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.File),
            name: (fileNodes as DialDeletedItem[])[0].sourceUrl,
          });
      return { title, description };
    }
    case ApplicationRoute.Prompts: {
      const title = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Items) })
        : t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Prompt) });
      const description = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessDescriptionForMany, {
            count: deletedItemsCount,
          })
        : t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.Prompt),
            name: (fileNodes as DialFile[])?.[0].name || '',
            path: destinationFolder || '/',
          });
      return { title, description };
    }
    case ApplicationRoute.AssetsApplications: {
      const title = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Items) })
        : t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Application) });
      const description = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessDescriptionForMany, {
            count: deletedItemsCount,
          })
        : t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.Application),
            name: (fileNodes as DialFile[])?.[0].name || '',
            path: destinationFolder || '/',
          });
      return { title, description };
    }
    case ApplicationRoute.AssetsToolsets: {
      const title = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Items) })
        : t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Toolset) });
      const description = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessDescriptionForMany, {
            count: deletedItemsCount,
          })
        : t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.Toolset),
            name: (fileNodes as DialFile[])?.[0].name || '',
            path: destinationFolder || '/',
          });
      return { title, description };
    }
    default:
      return {
        title: '',
        description: '',
      };
  }
};

export const getMoveNotificationContent = (
  view: ApplicationRoute,
  items: DialCopiedItem[],
  sourceFolder: string,
  destinationFolder: string,
  t: (key: string, options?: Record<string, string | number>) => string,
) => {
  const isMoveSeveralFiles = items.length > 1;
  const isRenameFolder =
    items.length === 1 && items[0].nodeType === DialFileNodeType.FOLDER && sourceFolder === destinationFolder;
  const isMoveFolder =
    items.length === 1 && items[0].nodeType === DialFileNodeType.FOLDER && sourceFolder !== destinationFolder;

  if (isRenameFolder) {
    return { title: t(FileManagerI18nKey.RenameFolderSuccessTitle), description: '' };
  }
  if (isMoveFolder) {
    const title = t(FileManagerI18nKey.MoveSuccessTitle, { item: t(FileManagerI18nKey.Folder) });
    const description = t(FileManagerI18nKey.MoveSuccessDescriptionForOne, {
      item: t(FileManagerI18nKey.Folder),
      name: items[0].sourceUrl,
      path: destinationFolder,
    });
    return { title, description };
  }

  switch (view) {
    case ApplicationRoute.Files: {
      const title = isMoveSeveralFiles
        ? t(FileManagerI18nKey.MoveSuccessTitle, { item: t(FileManagerI18nKey.Items) })
        : t(FileManagerI18nKey.MoveSuccessTitle, { item: t(FileManagerI18nKey.File) });
      const description = isMoveSeveralFiles
        ? t(FileManagerI18nKey.MoveSuccessDescriptionForMany, {
            count: items.length,
            path: destinationFolder,
          })
        : t(FileManagerI18nKey.MoveSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.File),
            name: items[0].sourceUrl,
            path: destinationFolder,
          });

      return { title, description };
    }
    case ApplicationRoute.Prompts: {
      const title = isMoveSeveralFiles
        ? t(FileManagerI18nKey.MoveSuccessTitle, { item: t(FileManagerI18nKey.Items) })
        : t(FileManagerI18nKey.MoveSuccessTitle, { item: t(FileManagerI18nKey.Prompt) });
      const description = isMoveSeveralFiles
        ? t(FileManagerI18nKey.MoveSuccessDescriptionForMany, {
            count: items.length,
            path: destinationFolder,
          })
        : t(FileManagerI18nKey.MoveSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.Prompt),
            name: items[0].sourceUrl,
            path: destinationFolder,
          });

      return { title, description };
    }
    case ApplicationRoute.AssetsApplications: {
      const title = isMoveSeveralFiles
        ? t(FileManagerI18nKey.MoveSuccessTitle, { item: t(FileManagerI18nKey.Items) })
        : t(FileManagerI18nKey.MoveSuccessTitle, { item: t(FileManagerI18nKey.Application) });
      const description = isMoveSeveralFiles
        ? t(FileManagerI18nKey.MoveSuccessDescriptionForMany, {
            count: items.length,
            path: destinationFolder,
          })
        : t(FileManagerI18nKey.MoveSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.Application),
            name: items[0].sourceUrl,
            path: destinationFolder,
          });
      return { title, description };
    }
    case ApplicationRoute.AssetsToolsets: {
      const title = isMoveSeveralFiles
        ? t(FileManagerI18nKey.MoveSuccessTitle, { item: t(FileManagerI18nKey.Items) })
        : t(FileManagerI18nKey.MoveSuccessTitle, { item: t(FileManagerI18nKey.Toolset) });
      const description = isMoveSeveralFiles
        ? t(FileManagerI18nKey.MoveSuccessDescriptionForMany, {
            count: items.length,
            path: destinationFolder,
          })
        : t(FileManagerI18nKey.MoveSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.Toolset),
            name: items[0].sourceUrl,
            path: destinationFolder,
          });
      return { title, description };
    }
    default:
      return {
        title: '',
        description: '',
      };
  }
};

export const getExportNotificationContent = (
  view: ApplicationRoute,
  files: DialFile[],
  t: (key: string, options?: Record<string, string | number>) => string,
  filePaths: string[] = [],
) => {
  switch (view) {
    case ApplicationRoute.Files: {
      const isExportSeveralFiles =
        files.length > 1 || (files.length === 1 && files[0].nodeType === DialFileNodeType.FOLDER);
      const title = isExportSeveralFiles
        ? t(FileManagerI18nKey.ExportSuccessTitle, { item: t(FileManagerI18nKey.Files) })
        : t(FileManagerI18nKey.ExportSuccessTitle, { item: t(FileManagerI18nKey.File) });
      const description = isExportSeveralFiles
        ? t(FileManagerI18nKey.ExportSuccessDescriptionForMany)
        : t(FileManagerI18nKey.ExportSuccessDescriptionForOne, { item: t(FileManagerI18nKey.File) });

      return { title, description };
    }
    case ApplicationRoute.Prompts: {
      const isExportSeveralPrompt =
        filePaths.length > 1 || (files.length === 1 && files[0].nodeType === DialFileNodeType.FOLDER);
      const title = isExportSeveralPrompt
        ? t(FileManagerI18nKey.ExportSuccessTitle, { item: t(FileManagerI18nKey.Prompts) })
        : t(FileManagerI18nKey.ExportSuccessTitle, { item: t(FileManagerI18nKey.Prompt) });
      const description = isExportSeveralPrompt
        ? t(FileManagerI18nKey.ExportSuccessDescriptionForMany)
        : t(FileManagerI18nKey.ExportSuccessDescriptionForOne, { item: t(FileManagerI18nKey.Prompt) });

      return { title, description };
    }
    case ApplicationRoute.AssetsApplications: {
      const isExportSeveralApps =
        filePaths.length > 1 || (files.length === 1 && files[0].nodeType === DialFileNodeType.FOLDER);
      const title = isExportSeveralApps
        ? t(FileManagerI18nKey.ExportSuccessTitle, { item: t(FileManagerI18nKey.Applications) })
        : t(FileManagerI18nKey.ExportSuccessTitle, { item: t(FileManagerI18nKey.Application) });
      const description = isExportSeveralApps
        ? t(FileManagerI18nKey.ExportSuccessDescriptionForMany)
        : t(FileManagerI18nKey.ExportSuccessDescriptionForOne, { item: t(FileManagerI18nKey.Application) });

      return { title, description };
    }
    case ApplicationRoute.AssetsToolsets: {
      const isExportSeveralToolsets =
        filePaths.length > 1 || (files.length === 1 && files[0].nodeType === DialFileNodeType.FOLDER);
      const title = isExportSeveralToolsets
        ? t(FileManagerI18nKey.ExportSuccessTitle, { item: t(FileManagerI18nKey.Toolsets) })
        : t(FileManagerI18nKey.ExportSuccessTitle, { item: t(FileManagerI18nKey.Toolset) });
      const description = isExportSeveralToolsets
        ? t(FileManagerI18nKey.ExportSuccessDescriptionForMany)
        : t(FileManagerI18nKey.ExportSuccessDescriptionForOne, { item: t(FileManagerI18nKey.Toolset) });

      return { title, description };
    }
    default:
      return {
        title: '',
        description: '',
      };
  }
};

export const getImportNotificationContent = (
  view: ApplicationRoute,
  importResults: { targetPath: string; status: string; error?: string }[] | undefined,
  fileType: ImportFileType,
  destinationFolder: string,
  t: (key: string, options?: Record<string, string | number>) => string,
) => {
  const successfullyItems = importResults?.filter((result) => result.status === 'success') || [];
  const failedResults = importResults?.filter((result) => result.status === 'failure') || [];
  const failedItems = failedResults.map((result) => result.targetPath);
  const failedMessages = Array.from(new Set(failedResults.map((result) => result.error || result.targetPath)));
  const skippedItems =
    importResults?.filter((result) => result.status === 'skipped').map((result) => result.targetPath) || [];
  const isImportSeveralItems = successfullyItems.length > 1;

  switch (view) {
    case ApplicationRoute.Files: {
      const title = isImportSeveralItems
        ? t(FileManagerI18nKey.ImportSuccessTitle, { item: t(FileManagerI18nKey.Files) })
        : t(FileManagerI18nKey.ImportSuccessTitle, { item: t(FileManagerI18nKey.File) });
      let description = '';
      if (fileType === ImportFileType.ARCHIVE) {
        description = t(FileManagerI18nKey.ImportSuccessDescriptionForArchive, {
          item: t(FileManagerI18nKey.Files),
          path: destinationFolder,
        });
      } else {
        description = isImportSeveralItems
          ? t(FileManagerI18nKey.ImportSuccessDescriptionForMany, {
              count: successfullyItems.length,
              path: destinationFolder,
            })
          : t(FileManagerI18nKey.ImportSuccessDescriptionForOne, {
              item: t(FileManagerI18nKey.File),
              path: destinationFolder,
            });
      }

      return {
        title: successfullyItems.length > 0 ? title : '',
        description: successfullyItems.length > 0 ? description : '',
        skippedTitle:
          skippedItems.length > 0
            ? t(FileManagerI18nKey.ImportSkippedTitle, {
                count: skippedItems.length,
                item: skippedItems.length > 1 ? t(FileManagerI18nKey.Files) : t(FileManagerI18nKey.File),
              })
            : '',
        skippedDescription:
          skippedItems.length > 0
            ? t(FileManagerI18nKey.ImportSkippedDescription, {
                item: skippedItems.length > 1 ? t(FileManagerI18nKey.Files) : t(FileManagerI18nKey.File),
                list: skippedItems.join(', '),
              })
            : '',
        errorTitle:
          failedItems.length > 0
            ? t(FileManagerI18nKey.ImportErrorTitle, {
                count: failedItems.length,
                item: failedItems.length > 1 ? t(FileManagerI18nKey.Files) : t(FileManagerI18nKey.File),
              })
            : '',
        errorDescription:
          failedItems.length > 0
            ? t(FileManagerI18nKey.ImportErrorDescription, {
                list: failedMessages.join(', '),
              })
            : '',
      };
    }
    case ApplicationRoute.Prompts: {
      const title = isImportSeveralItems
        ? t(FileManagerI18nKey.ImportSuccessTitle, { item: t(FileManagerI18nKey.Prompts) })
        : t(FileManagerI18nKey.ImportSuccessTitle, { item: t(FileManagerI18nKey.Prompt) });
      let description = '';
      if (fileType === ImportFileType.ARCHIVE) {
        description = t(FileManagerI18nKey.ImportSuccessDescriptionForArchive, {
          item: t(FileManagerI18nKey.Prompts),
          path: destinationFolder,
        });
      } else {
        description = isImportSeveralItems
          ? t(FileManagerI18nKey.ImportSuccessDescriptionForMany, {
              count: successfullyItems.length,
              path: destinationFolder,
            })
          : t(FileManagerI18nKey.ImportSuccessDescriptionForOne, {
              item: t(FileManagerI18nKey.Prompt),
              path: destinationFolder,
            });
      }

      return {
        title: successfullyItems.length > 0 ? title : '',
        description: successfullyItems.length > 0 ? description : '',
        skippedTitle:
          skippedItems.length > 0
            ? t(FileManagerI18nKey.ImportSkippedTitle, {
                count: skippedItems.length,
                item: skippedItems.length > 1 ? t(FileManagerI18nKey.Prompts) : t(FileManagerI18nKey.Prompt),
              })
            : '',
        skippedDescription:
          skippedItems.length > 0
            ? t(FileManagerI18nKey.ImportSkippedDescription, {
                item: skippedItems.length > 1 ? t(FileManagerI18nKey.Prompts) : t(FileManagerI18nKey.Prompt),
                list: skippedItems.join(', '),
              })
            : '',
        errorTitle:
          failedItems.length > 0
            ? t(FileManagerI18nKey.ImportErrorTitle, {
                count: failedItems.length,
                item: failedItems.length > 1 ? t(FileManagerI18nKey.Prompts) : t(FileManagerI18nKey.Prompt),
              })
            : '',
        errorDescription:
          failedItems.length > 0
            ? t(FileManagerI18nKey.ImportErrorDescription, {
                list: failedMessages.join(', '),
              })
            : '',
      };
    }
    case ApplicationRoute.AssetsApplications: {
      const title = isImportSeveralItems
        ? t(FileManagerI18nKey.ImportSuccessTitle, { item: t(FileManagerI18nKey.Applications) })
        : t(FileManagerI18nKey.ImportSuccessTitle, { item: t(FileManagerI18nKey.Application) });
      let description = '';
      if (fileType === ImportFileType.ARCHIVE) {
        description = t(FileManagerI18nKey.ImportSuccessDescriptionForArchive, {
          item: t(FileManagerI18nKey.Applications),
          path: destinationFolder,
        });
      } else {
        description = isImportSeveralItems
          ? t(FileManagerI18nKey.ImportSuccessDescriptionForMany, {
              count: successfullyItems.length,
              path: destinationFolder,
            })
          : t(FileManagerI18nKey.ImportSuccessDescriptionForOne, {
              item: t(FileManagerI18nKey.Application),
              path: destinationFolder,
            });
      }

      return {
        title: successfullyItems.length > 0 ? title : '',
        description: successfullyItems.length > 0 ? description : '',
        skippedTitle:
          skippedItems.length > 0
            ? t(FileManagerI18nKey.ImportSkippedTitle, {
                count: skippedItems.length,
                item: skippedItems.length > 1 ? t(FileManagerI18nKey.Applications) : t(FileManagerI18nKey.Application),
              })
            : '',
        skippedDescription:
          skippedItems.length > 0
            ? t(FileManagerI18nKey.ImportSkippedDescription, {
                item: skippedItems.length > 1 ? t(FileManagerI18nKey.Applications) : t(FileManagerI18nKey.Application),
                list: skippedItems.join(', '),
              })
            : '',
        errorTitle:
          failedItems.length > 0
            ? t(FileManagerI18nKey.ImportErrorTitle, {
                count: failedItems.length,
                item: failedItems.length > 1 ? t(FileManagerI18nKey.Applications) : t(FileManagerI18nKey.Application),
              })
            : '',
        errorDescription:
          failedItems.length > 0
            ? t(FileManagerI18nKey.ImportErrorDescription, {
                list: failedMessages.join(', '),
              })
            : '',
      };
    }
    case ApplicationRoute.AssetsToolsets: {
      const title = isImportSeveralItems
        ? t(FileManagerI18nKey.ImportSuccessTitle, { item: t(FileManagerI18nKey.Toolsets) })
        : t(FileManagerI18nKey.ImportSuccessTitle, { item: t(FileManagerI18nKey.Toolset) });
      let description = '';
      if (fileType === ImportFileType.ARCHIVE) {
        description = t(FileManagerI18nKey.ImportSuccessDescriptionForArchive, {
          item: t(FileManagerI18nKey.Toolsets),
          path: destinationFolder,
        });
      } else {
        description = isImportSeveralItems
          ? t(FileManagerI18nKey.ImportSuccessDescriptionForMany, {
              count: successfullyItems.length,
              path: destinationFolder,
            })
          : t(FileManagerI18nKey.ImportSuccessDescriptionForOne, {
              item: t(FileManagerI18nKey.Toolset),
              path: destinationFolder,
            });
      }

      return {
        title: successfullyItems.length > 0 ? title : '',
        description: successfullyItems.length > 0 ? description : '',
        skippedTitle:
          skippedItems.length > 0
            ? t(FileManagerI18nKey.ImportSkippedTitle, {
                count: skippedItems.length,
                item: skippedItems.length > 1 ? t(FileManagerI18nKey.Toolsets) : t(FileManagerI18nKey.Toolset),
              })
            : '',
        skippedDescription:
          skippedItems.length > 0
            ? t(FileManagerI18nKey.ImportSkippedDescription, {
                item: skippedItems.length > 1 ? t(FileManagerI18nKey.Toolsets) : t(FileManagerI18nKey.Toolset),
                list: skippedItems.join(', '),
              })
            : '',
        errorTitle:
          failedItems.length > 0
            ? t(FileManagerI18nKey.ImportErrorTitle, {
                count: failedItems.length,
                item: failedItems.length > 1 ? t(FileManagerI18nKey.Toolsets) : t(FileManagerI18nKey.Toolset),
              })
            : '',
        errorDescription:
          failedItems.length > 0
            ? t(FileManagerI18nKey.ImportErrorDescription, {
                list: failedMessages.join(', '),
              })
            : '',
      };
    }
    default:
      return {
        title: '',
        description: '',
        errorTitle: '',
        errorDescription: '',
        skippedTitle: '',
        skippedDescription: '',
      };
  }
};

export const getNameAndVersionByPath = (path: string): { name: string; version: string } => {
  const nameWithVersion = path.split('/').pop() || '';
  const lastUnderscoreIndex = nameWithVersion.lastIndexOf('__');
  if (lastUnderscoreIndex === -1) {
    return { name: nameWithVersion, version: '' };
  }
  return {
    name: nameWithVersion.slice(0, lastUnderscoreIndex),
    version: nameWithVersion.slice(lastUnderscoreIndex + 2),
  };
};
