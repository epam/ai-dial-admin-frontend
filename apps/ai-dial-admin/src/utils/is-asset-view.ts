import { ApplicationRoute } from '@/src/types/routes';

export const isAssetView = (view?: ApplicationRoute): boolean => {
  return view === ApplicationRoute.Prompts || view === ApplicationRoute.Files || isDeploymentAsset(view);
};

export const isDeploymentAsset = (view?: ApplicationRoute): boolean => {
  return view === ApplicationRoute.AssetsApplications || view === ApplicationRoute.AssetsToolsets;
};

export const isBuildersView = (view?: ApplicationRoute): boolean => {
  return (
    view === ApplicationRoute.Adapters ||
    view === ApplicationRoute.ApplicationRunners ||
    view === ApplicationRoute.InterceptorTemplates
  );
};
