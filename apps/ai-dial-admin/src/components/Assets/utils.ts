import { DialAssetApp } from '@/src/models/dial/asset-app';
import { DialPrompt } from '@/src/models/dial/prompt';
import { compareVersions } from '@/src/utils/prompts/versions';

export const filterLatestVersions = (data: (DialPrompt | DialAssetApp)[]) => {
  const latestVersions: Record<string, DialPrompt> = {};

  data?.forEach((item) => {
    const name = item.name as string;
    if (!latestVersions[name] || compareVersions(item.version, latestVersions[name].version) > 0) {
      latestVersions[name] = item as DialPrompt;
    }
  });

  return Object.values(latestVersions);
};

export const getVersionsPerName = (data: (DialPrompt | DialAssetApp)[]) => {
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

export const getIsNeedToMove = (entity: DialPrompt | DialAssetApp, initialEntity?: DialPrompt | DialAssetApp) => {
  return entity.folderId !== initialEntity?.folderId;
};

export const getEntityForUpdate = (entity: DialPrompt | DialAssetApp, initialEntity?: DialPrompt | DialAssetApp) => {
  return {
    ...entity,
    folderId: (initialEntity as DialPrompt | DialAssetApp)?.folderId,
  };
};
