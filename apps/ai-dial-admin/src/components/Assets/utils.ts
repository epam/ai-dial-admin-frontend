import { ImageVersion } from '@/src/models/deployments/images';
import { AssetApp, AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { compareVersions, modifyNameVersionInPrompt } from '@/src/utils/prompts/versions';
import { ApplicationRoute } from '@/src/types/routes';
import { allActionLabels, allToolbarOptionLabels } from './constants';
import { ButtonsI18nKey } from '@/src/constants/i18n';

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
      return isReadOnlyAdmin
        ? []
        : allActionLabels.filter((item) => item.key !== 'duplicate' && item.key !== 'openInNewTab');
    case ApplicationRoute.Prompts:
      return isReadOnlyAdmin ? [] : allActionLabels.filter((item) => item.key !== 'preview');
    default:
      return [];
  }
};

export const getTreeActionLabels = (isReadOnlyAdmin: boolean) => {
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
      return allToolbarOptionLabels.filter((item) => item.key !== 'newItem');
    case ApplicationRoute.Prompts:
      return allToolbarOptionLabels.map((option) => {
        return option.key === 'uploadFiles' ? { ...option, label: ButtonsI18nKey.Import } : option;
      });
    default:
      return [];
  }
};
