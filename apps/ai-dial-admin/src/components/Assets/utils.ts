import { ImageVersion } from '@/src/models/deployments/images';
import { AssetApp, AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { Deployment } from '@/src/models/evaluation/deployment';
import { compareVersions, modifyNameVersionInAsset } from '@/src/utils/entities/versions';
import {
  CatalogDeploymentRecord,
  resolveCatalogDeploymentNavigation,
  resolveDeploymentNavigationTarget,
} from '@/src/utils/deployment-navigation';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { isFlatPlatformView, isPlatformBucketPath, isPlatformDualBucketView } from '@/src/utils/files/root-folder';
import { ApplicationRoute } from '@/src/types/routes';
import { allActionLabels, baseToolbarOptionLabels } from './constants';
import { ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';
import { ImportFileType } from '@/src/types/import';
import { DialCopiedItem, DialDeletedItem, DialFile, DialFileNodeType } from '@epam/ai-dial-ui-kit';

const isEvalDeployment = (deployment: CatalogDeploymentRecord | Deployment): deployment is Deployment =>
  '$type' in deployment && typeof deployment.$type === 'string';

export const getAgentLinkForConversation = (
  deployment: CatalogDeploymentRecord | Deployment | null,
  currentLocale: string,
): string => {
  if (!deployment) {
    return '';
  }

  const target = isEvalDeployment(deployment)
    ? resolveDeploymentNavigationTarget(
        { id: deployment.deploymentId, name: deployment.displayName },
        deployment.$type,
        [],
      )
    : resolveCatalogDeploymentNavigation(deployment);

  if (!target) {
    return '';
  }
  return `/${currentLocale}${getUrnForEntity(target.route, target.entity)}`;
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

export const getGridActionLabels = (view: ApplicationRoute, isReadOnlyAdmin: boolean, currentPath?: string) => {
  switch (view) {
    case ApplicationRoute.Files:
      return isReadOnlyAdmin
        ? []
        : allActionLabels.filter((item) => item.key !== 'duplicate' && item.key !== 'openInNewTab');
    case ApplicationRoute.PlatformModels:
    case ApplicationRoute.PlatformAppRunners:
    case ApplicationRoute.PlatformInterceptors:
    case ApplicationRoute.PlatformRoutes:
    case ApplicationRoute.PlatformRoles:
    case ApplicationRoute.PlatformKeys:
      return isReadOnlyAdmin
        ? []
        : allActionLabels.filter(
            (item) => item.key === 'duplicate' || item.key === 'delete' || item.key === 'openInNewTab',
          );
    case ApplicationRoute.AssetsApplications:
    case ApplicationRoute.AssetsToolsets:
      if (isPlatformDualBucketView(view, currentPath)) {
        return isReadOnlyAdmin
          ? []
          : allActionLabels.filter(
              (item) => item.key === 'duplicate' || item.key === 'delete' || item.key === 'openInNewTab',
            );
      }
      return isReadOnlyAdmin ? [] : allActionLabels.filter((item) => item.key !== 'preview');
    case ApplicationRoute.Prompts:
      return isReadOnlyAdmin ? [] : allActionLabels.filter((item) => item.key !== 'preview');
    case ApplicationRoute.Conversations:
    case ApplicationRoute.Skills:
      return isReadOnlyAdmin
        ? []
        : allActionLabels.filter((item) => item.key === 'delete' || item.key === 'openInNewTab');
    default:
      return [];
  }
};

export const getTreeActionLabels = (isReadOnlyAdmin: boolean, view: ApplicationRoute, currentPath?: string) => {
  if (isFlatPlatformView(view) || isPlatformDualBucketView(view, currentPath)) {
    return [];
  }

  // Skills offers no folder-tree actions at all: creating/renaming/moving a folder isn't supported
  // (no create/move on this surface — see design's Non-Goals), and folder delete isn't wired either
  // (`getResourceTypeByRoute` deliberately has no SKILL case, since Skill has no `AssetApi`-shaped
  // delete path), so offering it here would silently no-op.
  if (view === ApplicationRoute.Skills) {
    return [];
  }

  if (view === ApplicationRoute.Conversations) {
    return isReadOnlyAdmin ? [] : allActionLabels.filter((item) => item.key === 'delete');
  }

  return isReadOnlyAdmin
    ? []
    : allActionLabels.filter(
        (item) => item.key !== 'duplicate' && item.key !== 'preview' && item.key !== 'openInNewTab',
      );
};

export const getToolbarOptionLabels = (view: ApplicationRoute, isReadOnlyAdmin: boolean, currentPath?: string) => {
  if (isReadOnlyAdmin) return [];

  if (isPlatformDualBucketView(view, currentPath)) {
    const label =
      view === ApplicationRoute.AssetsToolsets ? FileManagerI18nKey.Toolset : FileManagerI18nKey.Application;
    return [{ key: 'newItem', label, icon: null }];
  }

  switch (view) {
    case ApplicationRoute.Files:
      return [...baseToolbarOptionLabels, { key: 'uploadFiles', label: FileManagerI18nKey.Files, icon: null }];
    case ApplicationRoute.PlatformAppRunners:
      return [
        {
          key: 'newItem',
          label: FileManagerI18nKey.AppRunner,
          icon: null,
        },
      ];
    case ApplicationRoute.PlatformModels:
      return [
        {
          key: 'newItem',
          label: FileManagerI18nKey.Model,
          icon: null,
        },
      ];
    case ApplicationRoute.PlatformInterceptors:
      return [
        {
          key: 'newItem',
          label: FileManagerI18nKey.Interceptor,
          icon: null,
        },
      ];
    case ApplicationRoute.PlatformRoutes:
      return [
        {
          key: 'newItem',
          label: FileManagerI18nKey.Route,
          icon: null,
        },
      ];
    case ApplicationRoute.PlatformRoles:
      return [
        {
          key: 'newItem',
          label: FileManagerI18nKey.Role,
          icon: null,
        },
      ];
    case ApplicationRoute.PlatformKeys:
      return [
        {
          key: 'newItem',
          label: FileManagerI18nKey.Key,
          icon: null,
        },
      ];
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
    case ApplicationRoute.Skills:
      return [
        ...baseToolbarOptionLabels,
        {
          key: 'newItem',
          label: FileManagerI18nKey.Skill,
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
) => {
  const deletedItemsCount = fileNodes.reduce((count, item) => {
    const itemCount =
      item.nodeType === DialFileNodeType.ITEM ? (item as AssetWithVersion)?.selectedVersions?.length || 1 : 1;
    return count + itemCount;
  }, 0);

  const isDeleteSeveralFiles = deletedItemsCount > 1;
  const isDeleteFolder =
    fileNodes.length === 1 && (fileNodes[0] as DialDeletedItem).nodeType === DialFileNodeType.FOLDER;
  const isMultipleVersionsDelete = fileNodes.length === 1 && deletedItemsCount > 1;
  const nameWithPath = `${(fileNodes as DialFile[])?.[0].folderId || ''}${(fileNodes as DialFile[])?.[0].name || ''}`;

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
      if (isMultipleVersionsDelete) {
        const title = t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Conversation) });
        const descriptions = (fileNodes as AssetWithVersion[])[0].selectedVersions?.map((version) =>
          t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.Conversation),
            name: `${nameWithPath}__${version}`,
          }),
        );

        return descriptions?.map((description) => ({ title, description }));
      }
      const title = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Items) })
        : t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Conversation) });
      const description = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessDescriptionForMany, {
            count: deletedItemsCount,
          })
        : t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.Conversation),
            name: `${nameWithPath}__${(fileNodes as AssetWithVersion[])?.[0].selectedVersions?.[0] || (fileNodes as AssetWithVersion[])?.[0].version || ''}`,
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
      if (isMultipleVersionsDelete) {
        const title = t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Prompt) });
        const descriptions = (fileNodes as AssetWithVersion[])[0].selectedVersions?.map((version) =>
          t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.Prompt),
            name: `${nameWithPath}__${version}`,
          }),
        );

        return descriptions?.map((description) => ({ title, description }));
      }
      const title = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Items) })
        : t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Prompt) });
      const description = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessDescriptionForMany, {
            count: deletedItemsCount,
          })
        : t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.Prompt),
            name: `${nameWithPath}__${(fileNodes as AssetWithVersion[])?.[0].selectedVersions?.[0] || (fileNodes as AssetWithVersion[])?.[0].version || ''}`,
          });
      return { title, description };
    }
    case ApplicationRoute.PlatformAppRunners:
    case ApplicationRoute.PlatformInterceptors:
    case ApplicationRoute.PlatformRoutes:
    case ApplicationRoute.PlatformRoles:
    case ApplicationRoute.PlatformKeys:
    case ApplicationRoute.PlatformModels: {
      const itemLabel = (() => {
        if (view === ApplicationRoute.PlatformAppRunners) return FileManagerI18nKey.AppRunner;
        if (view === ApplicationRoute.PlatformInterceptors) return FileManagerI18nKey.Interceptor;
        if (view === ApplicationRoute.PlatformRoutes) return FileManagerI18nKey.Route;
        if (view === ApplicationRoute.PlatformRoles) return FileManagerI18nKey.Role;
        if (view === ApplicationRoute.PlatformKeys) return FileManagerI18nKey.Key;
        return FileManagerI18nKey.Model;
      })();
      const title = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Items) })
        : t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(itemLabel) });
      const description = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessDescriptionForMany, {
            count: deletedItemsCount,
          })
        : t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
            item: t(itemLabel),
            name: nameWithPath,
          });
      return { title, description };
    }
    case ApplicationRoute.AssetsApplications: {
      // A platform-bucket row has no version to select or append — `isMultipleVersionsDelete`
      // never applies there, and the description shows the bare name rather than a
      // `folderId+name__version` path that carries no meaning for a flat, unversioned resource.
      if (isPlatformBucketPath((fileNodes as DialFile[])?.[0]?.folderId)) {
        const title = isDeleteSeveralFiles
          ? t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Items) })
          : t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Application) });
        const description = isDeleteSeveralFiles
          ? t(FileManagerI18nKey.DeleteSuccessDescriptionForMany, { count: deletedItemsCount })
          : t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
              item: t(FileManagerI18nKey.Application),
              name: (fileNodes as DialFile[])?.[0]?.name || '',
            });
        return { title, description };
      }

      if (isMultipleVersionsDelete) {
        const title = t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Application) });
        const descriptions = (fileNodes as AssetWithVersion[])[0].selectedVersions?.map((version) =>
          t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.Application),
            name: `${nameWithPath}__${version}`,
          }),
        );

        return descriptions?.map((description) => ({ title, description }));
      }

      const title = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Items) })
        : t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Application) });
      const description = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessDescriptionForMany, {
            count: deletedItemsCount,
          })
        : t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.Application),
            name: `${nameWithPath}__${(fileNodes as AssetWithVersion[])?.[0].selectedVersions?.[0] || (fileNodes as AssetWithVersion[])?.[0].version || ''}`,
          });
      return { title, description };
    }
    case ApplicationRoute.AssetsToolsets: {
      // Same platform-bucket carve-out as AssetsApplications above.
      if (isPlatformBucketPath((fileNodes as DialFile[])?.[0]?.folderId)) {
        const title = isDeleteSeveralFiles
          ? t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Items) })
          : t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Toolset) });
        const description = isDeleteSeveralFiles
          ? t(FileManagerI18nKey.DeleteSuccessDescriptionForMany, { count: deletedItemsCount })
          : t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
              item: t(FileManagerI18nKey.Toolset),
              name: (fileNodes as DialFile[])?.[0]?.name || '',
            });
        return { title, description };
      }

      if (isMultipleVersionsDelete) {
        const title = t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Toolset) });
        const descriptions = (fileNodes as AssetWithVersion[])[0].selectedVersions?.map((version) =>
          t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.Toolset),
            name: `${nameWithPath}__${version}`,
          }),
        );

        return descriptions?.map((description) => ({ title, description }));
      }

      const title = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Items) })
        : t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Toolset) });
      const description = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessDescriptionForMany, {
            count: deletedItemsCount,
          })
        : t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.Toolset),
            name: `${nameWithPath}__${(fileNodes as AssetWithVersion[])?.[0].selectedVersions?.[0] || (fileNodes as AssetWithVersion[])?.[0].version || ''}`,
          });
      return { title, description };
    }
    case ApplicationRoute.Skills: {
      const title = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Items) })
        : t(FileManagerI18nKey.DeleteSuccessTitle, { item: t(FileManagerI18nKey.Skill) });
      const description = isDeleteSeveralFiles
        ? t(FileManagerI18nKey.DeleteSuccessDescriptionForMany, { count: deletedItemsCount })
        : t(FileManagerI18nKey.DeleteSuccessDescriptionForOne, {
            item: t(FileManagerI18nKey.Skill),
            name: nameWithPath,
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
