import { ROOT_FOLDER } from '@/src/constants/file';
import { ApplicationRoute } from '@/src/types/routes';

/** Core's fixed bucket for `ConfigResourceController`-backed resource types. */
export const PLATFORM_ROOT_FOLDER = 'platform';

const ROOT_FOLDER_BY_VIEW: Partial<Record<ApplicationRoute, string>> = {
  [ApplicationRoute.AssetsModels]: PLATFORM_ROOT_FOLDER,
  [ApplicationRoute.AssetsAppRunners]: PLATFORM_ROOT_FOLDER,
};

export const getRootFolder = (view: ApplicationRoute): string => ROOT_FOLDER_BY_VIEW[view] ?? ROOT_FOLDER;
