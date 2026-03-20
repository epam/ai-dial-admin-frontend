import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialModel } from '@/src/models/dial/model';

export const getNamesConfigurations = (namesWithVersions: string[]) => {
  const names: string[] = [];
  const versionsMap: Record<string, string[]> = {};
  namesWithVersions.forEach((name) => {
    const [displayName, displayVersion] = name.split('___');
    names.push(displayName);

    if (!versionsMap[displayName]) {
      versionsMap[displayName] = [];
    }
    versionsMap[displayName].push(displayVersion);
  });

  return {
    names,
    versionsMap,
  };
};

export const filterDisplayNamesWithVersions = (entities?: DialModel[] | null, currentModel?: DialModel): string[] => {
  return (
    (entities?.reduce((acc, curr) => {
      if (curr.displayName != null && curr.displayName !== currentModel?.displayName) {
        acc.push(`${curr.displayName}___${curr.displayVersion || ''}`);
      }

      if (curr.displayName === currentModel?.displayName && curr.displayVersion !== currentModel?.displayVersion) {
        acc.push(`${curr.displayName}___${curr.displayVersion || ''}`);
      }
      return acc;
    }, [] as string[]) as string[]) || []
  );
};

export const filterDisplayNames = (entities?: BaseEntity[] | null, currentDisplayName?: string): string[] => {
  return (
    (entities?.reduce((acc, curr) => {
      if (curr.displayName != null && curr.displayName !== currentDisplayName) {
        acc.push(curr.displayName);
      }
      return acc;
    }, [] as string[]) as string[]) || []
  );
};

export const filterNames = (entities?: BaseEntity[] | null, currentName?: string): string[] => {
  return (
    (entities?.reduce((acc, curr) => {
      if (curr.name != null && curr.name !== currentName) {
        acc.push(curr.name);
      }
      return acc;
    }, [] as string[]) as string[]) || []
  );
};
