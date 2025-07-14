export const getNameExtensionFromFile = (input: string): { name: string; extension: string } => {
  const lastUnderscoreIndex = input.lastIndexOf('.');

  if (lastUnderscoreIndex === -1) {
    return { name: input, extension: '' };
  }

  const name = input.substring(0, lastUnderscoreIndex);
  const extension = input.substring(lastUnderscoreIndex);

  return { name, extension };
};
