import { ApplicationRoute } from '@/src/types/routes';

export const isAssetView = (view: ApplicationRoute): boolean => {
  return (
    view === ApplicationRoute.Prompts || view === ApplicationRoute.Files || view === ApplicationRoute.AssetsApplications
  );
};
