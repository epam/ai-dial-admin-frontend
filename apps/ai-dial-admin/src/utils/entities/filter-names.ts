import { BaseEntity } from '@/src/models/dial/base-entity';

export const filterDisplayNames = (entities?: BaseEntity[] | null): string[] => {
  return (
    (entities?.reduce((acc, curr) => {
      if (curr.displayName != null) {
        acc.push(curr.displayName);
      }
      return acc;
    }, [] as string[]) as string[]) || []
  );
};

export const filterNames = (entities?: BaseEntity[] | null): string[] => {
  return (
    (entities?.reduce((acc, curr) => {
      if (curr.name != null) {
        acc.push(curr.name);
      }
      return acc;
    }, [] as string[]) as string[]) || []
  );
};
