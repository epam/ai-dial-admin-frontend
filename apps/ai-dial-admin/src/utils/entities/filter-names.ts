import { BaseEntity } from '@/src/models/dial/base-entity';

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
