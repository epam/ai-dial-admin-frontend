import { DialPrompt } from '@/src/models/dial/prompt';

export const filterLatestVersions = (data: DialPrompt[]) => {
  const latestVersions: Record<string, DialPrompt> = {};

  data?.forEach((item) => {
    const name = item.name as string;
    if (!latestVersions[name] || item.updateTime > latestVersions[name].updateTime) {
      latestVersions[name] = item;
    }
  });

  return Object.values(latestVersions);
};

export const getVersionsPerName = (data: DialPrompt[]) => {
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
