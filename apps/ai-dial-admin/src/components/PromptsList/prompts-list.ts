import { DialPrompt } from '@/src/models/dial/prompt';
import { PROMPT_NAME_VERSION_DELIMITER } from '@/src/constants/prompt';

export const generateNameVersionForPrompt = (name: string, version: string) => {
  return `${name}${PROMPT_NAME_VERSION_DELIMITER}${version}`;
};

export const getNameVersionFromPrompt = (input: string): { name: string; version: string } => {
  const lastUnderscoreIndex = input.lastIndexOf(PROMPT_NAME_VERSION_DELIMITER);

  if (lastUnderscoreIndex === -1) {
    return { name: input, version: '' };
  }

  const name = input.substring(0, lastUnderscoreIndex);
  const version = input.substring(lastUnderscoreIndex + 2);

  return { name, version };
};

export const modifyNameVersionInPrompt = (input: string, newName?: string, newVersion?: string): string => {
  const pathParts = input.split('/');
  const fileName = pathParts[pathParts.length - 1];
  const lastUnderscoreIndex = fileName.lastIndexOf(PROMPT_NAME_VERSION_DELIMITER);

  let name: string;
  let version: string;

  if (lastUnderscoreIndex === -1) {
    name = fileName;
    version = '';
  } else {
    name = fileName.substring(0, lastUnderscoreIndex);
    version = fileName.substring(lastUnderscoreIndex + PROMPT_NAME_VERSION_DELIMITER.length);
  }

  if (newName !== undefined) {
    name = newName;
  }
  if (newVersion !== undefined) {
    version = newVersion;
  }

  const modifiedFileName = version ? `${name}${PROMPT_NAME_VERSION_DELIMITER}${version}` : name;

  pathParts[pathParts.length - 1] = modifiedFileName;
  return pathParts.join('/');
};

export const getInitialVersion = (versionsPerName: Record<string, string[]>, name?: string) => {
  const latest = versionsPerName[name as string]?.sort(compareVersions).at(-1)?.split('.');
  if (latest) {
    latest[2] = `${+latest[2] + 1}`;
  }
  return latest?.join('.') || '';
};

export const checkNameVersionCombination = (
  versionsPerName: Record<string, string[]>,
  name: string,
  version: string,
) => {
  return versionsPerName[name] && versionsPerName[name].includes(version);
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

const compareVersions = (version1: string, version2: string) => {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const part1 = v1Parts[i] || 0;
    const part2 = v2Parts[i] || 0;

    if (part1 > part2) {
      return 1;
    }
    if (part1 < part2) {
      return -1;
    }
  }

  return 0;
};
