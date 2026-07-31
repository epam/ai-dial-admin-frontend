import { ApplicationRoute } from '@/src/types/routes';

export const isSimpleEntity = (view: ApplicationRoute) => {
  switch (view) {
    case ApplicationRoute.Applications:
    case ApplicationRoute.Models:
    case ApplicationRoute.Toolsets:
    case ApplicationRoute.AssetsToolsets:
    case ApplicationRoute.AssetsApplications:
    case ApplicationRoute.AssetsAppRunners:
    case ApplicationRoute.Prompts:
      return false;

    default:
      return true;
  }
};
