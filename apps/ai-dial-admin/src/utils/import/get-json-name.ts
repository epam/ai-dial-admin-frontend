import { ApplicationRoute } from '@/src/types/routes';

/**
 * Generate name for exported json file based on route
 *
 * @param {?ApplicationRoute} [route] - application route
 * @returns {string} - file name
 */
export const getJsonFileName = (route?: ApplicationRoute): string => {
  if (route === ApplicationRoute.Prompts) {
    return 'prompts';
  }
  if (route === ApplicationRoute.Files) {
    return 'files';
  }

  if (route === ApplicationRoute.AssetsApplications) {
    return 'applications';
  }

  if (route === ApplicationRoute.AssetsToolsets) {
    return 'toolSets';
  }

  return '';
};
