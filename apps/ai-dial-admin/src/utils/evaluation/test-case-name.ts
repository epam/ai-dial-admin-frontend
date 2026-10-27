export const getUniqueTestCaseCopyName = (name: string, existingNames: string[], copyPostfix: string): string => {
  const existingNamesSet = new Set(existingNames.map((existingName) => existingName.trim().toLowerCase()));
  const baseName = name.trim();
  const copyName = `${baseName ? `${baseName} ` : ''}${copyPostfix}`;
  let uniqueName = copyName;
  let suffix = 2;

  while (existingNamesSet.has(uniqueName.trim().toLowerCase())) {
    const numberedPostfix = copyPostfix.endsWith(')')
      ? `${copyPostfix.slice(0, -1)} ${suffix})`
      : `${copyPostfix} ${suffix}`;
    uniqueName = `${baseName ? `${baseName} ` : ''}${numberedPostfix}`;
    suffix += 1;
  }

  return uniqueName;
};
