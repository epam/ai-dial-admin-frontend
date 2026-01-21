import { ResourceType } from '@/src/types/resource-type';
import { ResourceBasePaths, ResourceOperation } from './constants';
import { ApplicationRoute } from '@/src/types/routes';
import { ImportFileType } from '@/src/types/import';

export const buildAssetUrl = (resource: ResourceType, operation?: ResourceOperation): string => {
  const basePath = ResourceBasePaths[resource];
  return operation ? `${basePath}/${operation}` : basePath;
};

export const buildCreateFolderUrl = (filetype?: string, view?: ApplicationRoute): string => {
  if (view === ApplicationRoute.Prompts) {
    return filetype === ImportFileType.ARCHIVE
      ? buildAssetUrl(ResourceType.PROMPT, ResourceOperation.IMPORT_ZIP)
      : buildAssetUrl(ResourceType.PROMPT, ResourceOperation.IMPORT_JSON);
  }

  if (view === ApplicationRoute.Files) {
    return filetype === ImportFileType.ARCHIVE
      ? buildAssetUrl(ResourceType.FILE, ResourceOperation.IMPORT_ZIP)
      : buildAssetUrl(ResourceType.FILE, ResourceOperation.IMPORT);
  }

  if (view === ApplicationRoute.AssetsApplications) {
    return filetype === ImportFileType.ARCHIVE
      ? buildAssetUrl(ResourceType.APPLICATION, ResourceOperation.IMPORT_ZIP)
      : buildAssetUrl(ResourceType.APPLICATION, ResourceOperation.IMPORT_JSON);
  }

  if (view === ApplicationRoute.AssetsToolsets) {
    return filetype === ImportFileType.ARCHIVE
      ? buildAssetUrl(ResourceType.TOOLSET, ResourceOperation.IMPORT_ZIP)
      : buildAssetUrl(ResourceType.TOOLSET, ResourceOperation.IMPORT_JSON);
  }
  return '';
};
