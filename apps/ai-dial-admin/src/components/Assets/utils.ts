import { ImageVersion } from '@/src/models/deployments/images';
import { AssetApp, AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { compareVersions, modifyNameVersionInPrompt } from '@/src/utils/prompts/versions';
import { ApplicationRoute } from '@/src/types/routes';
import { allActionLabels, allToolbarOptionLabels } from './constants';
import { ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';
import { ImportFileType } from '@/src/types/import';
import { ImportData, ParsedAssets } from '@/src/models/import-asset';
import { DialCopiedItem, DialDeletedItem, DialFile, DialFileNodeType } from '@epam/ai-dial-ui-kit';

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
  const path = modifyNameVersionInPrompt(entity.path, void 0, version);
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
      return isReadOnlyAdmin ? [] : allActionLabels.filter((item) => item.key !== 'duplicate');
    case ApplicationRoute.Prompts:
      return isReadOnlyAdmin ? [] : allActionLabels.filter((item) => item.key !== 'preview');
    default:
      return [];
  }
};

export const getTreeActionLabels = (isReadOnlyAdmin: boolean) => {
  return isReadOnlyAdmin ? [] : allActionLabels.filter((item) => item.key !== 'duplicate' && item.key !== 'preview');
};

export const getToolbarOptionLabels = (view: ApplicationRoute, isReadOnlyAdmin: boolean) => {
  if (isReadOnlyAdmin) return [];

  switch (view) {
    case ApplicationRoute.Files:
      return allToolbarOptionLabels.filter((item) => item.key !== 'newItem');
    case ApplicationRoute.Prompts:
      return allToolbarOptionLabels.map((option) => {
        return option.key === 'uploadFiles' ? { ...option, label: ButtonsI18nKey.Import } : option;
      });
    default:
      return [];
  }
};

export const getDeleteNotificationContent = (
  view: ApplicationRoute,
  fileNodes: DialDeletedItem[] | DialFile[],
  t: (key: string, options?: Record<string, string | number>) => string,
  destinationFolder?: string,
) => {
  const isDeleteSeveralFiles = fileNodes.length > 1;

  switch (view) {
    case ApplicationRoute.Files: {
      const title = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Files) })
        : t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.File) });
      const description = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessDescriptionForMany, {
            count: fileNodes.length,
          })
        : t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.File),
            name: (fileNodes as DialDeletedItem[])[0].sourceUrl,
          });
      return { title, description };
    }
    case ApplicationRoute.Prompts: {
      const title = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Prompts) })
        : t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Prompt) });
      const description = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessDescriptionForMany, {
            count: fileNodes.length,
          })
        : t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.Prompt),
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
  destinationFolder: string,
  t: (key: string, options?: Record<string, string | number>) => string,
) => {
  const isMoveSeveralFiles = items.length > 1;

  switch (view) {
    case ApplicationRoute.Files: {
      const title = isMoveSeveralFiles
        ? t(FileManagerI18nKey.MoveSuccessTitle, { item: t(FileManagerI18nKey.Files) })
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
        ? t(FileManagerI18nKey.MoveSuccessTitle, { item: t(FileManagerI18nKey.Prompts) })
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
    default:
      return {
        title: '',
        description: '',
      };
  }
};

export const getImportNotificationContent = (
  view: ApplicationRoute,
  file: ImportData,
  fileType: ImportFileType,
  destinationFolder: string,
  t: (key: string, options?: Record<string, string | number>) => string,
) => {
  switch (view) {
    case ApplicationRoute.Files: {
      const isImportSeveralFiles = Array.isArray(file) && file.length > 1;

      const title = isImportSeveralFiles
        ? t(FileManagerI18nKey.ImportSuccessTitle, { item: t(FileManagerI18nKey.Files) })
        : t(FileManagerI18nKey.ImportSuccessTitle, { item: t(FileManagerI18nKey.File) });
      let description = '';
      if (fileType === ImportFileType.ARCHIVE) {
        description = t(FileManagerI18nKey.ImportSuccessDescriptionForArchive, {
          item: t(FileManagerI18nKey.Files),
          path: destinationFolder,
        });
      } else {
        description = isImportSeveralFiles
          ? t(FileManagerI18nKey.ImportSuccessDescriptionForMany, {
              count: file.length,
              path: destinationFolder,
            })
          : t(FileManagerI18nKey.ImportSuccessDescriptionForOne, {
              item: t(FileManagerI18nKey.File),
              path: destinationFolder,
            });
      }

      return {
        title,
        description,
      };
    }
    case ApplicationRoute.Prompts: {
      const prompts = (file as ParsedAssets)?.prompts;
      const isImportSeveralPrompts = Array.isArray(prompts) && prompts.length > 1;

      const title = isImportSeveralPrompts
        ? t(FileManagerI18nKey.ImportSuccessTitle, { item: t(FileManagerI18nKey.Prompts) })
        : t(FileManagerI18nKey.ImportSuccessTitle, { item: t(FileManagerI18nKey.Prompt) });
      let description = '';
      if (fileType === ImportFileType.ARCHIVE) {
        description = t(FileManagerI18nKey.ImportSuccessDescriptionForArchive, {
          item: t(FileManagerI18nKey.Prompts),
          path: destinationFolder,
        });
      } else {
        description = isImportSeveralPrompts
          ? t(FileManagerI18nKey.ImportSuccessDescriptionForMany, {
              count: prompts.length,
              path: destinationFolder,
            })
          : t(FileManagerI18nKey.ImportSuccessDescriptionForOne, {
              item: t(FileManagerI18nKey.Prompt),
              path: destinationFolder,
            });
      }

      return {
        title,
        description,
      };
    }
    default:
      return {
        title: '',
        description: '',
      };
  }
};
