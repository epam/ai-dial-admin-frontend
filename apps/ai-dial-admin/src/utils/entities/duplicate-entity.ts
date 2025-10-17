export const getClonedEntityName = (name?: string): string => {
  const copySuffix = '_(copy)';
  if (name?.endsWith(copySuffix)) {
    return name;
  }
  return `${name}${copySuffix}`;
};
