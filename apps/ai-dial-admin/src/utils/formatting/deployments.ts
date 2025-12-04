export const formatDeploymentImageName = (data: {
  imageDefinitionName: string;
  imageDefinitionVersion: string;
}): string | null => {
  if (data.imageDefinitionName && data.imageDefinitionVersion) {
    return `${data.imageDefinitionName} (${data.imageDefinitionVersion})`;
  }

  return null;
};
