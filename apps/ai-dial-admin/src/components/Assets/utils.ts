import { Asset, AssetApp } from '@/src/models/dial/deployment-asset';
import { DialPrompt } from '@/src/models/dial/prompt';
import { compareVersions, modifyNameVersionInPrompt } from '@/src/utils/prompts/versions';
import { ImageVersion } from '@/src/models/deployments/images';

export const filterLatestVersions = (data: Asset[]) => {
  const latestVersions: Record<string, DialPrompt> = {};

  data?.forEach((item) => {
    const name = item.name as string;
    if (!latestVersions[name] || compareVersions(item.version, latestVersions[name].version) > 0) {
      latestVersions[name] = item as DialPrompt;
    }
  });

  return Object.values(latestVersions);
};

export const getVersionsPerName = (data: Asset[] | ImageVersion[]) => {
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

export const getIsNeedToMove = (entity: Asset, initialEntity?: Asset) => {
  return entity.folderId !== initialEntity?.folderId;
};

export const getEntityForUpdate = (entity: Asset, initialEntity?: Asset) => {
  return {
    ...entity,
    folderId: (initialEntity as Asset)?.folderId,
  };
};

export const addNewVersion = (entity: Asset, version: string) => {
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
