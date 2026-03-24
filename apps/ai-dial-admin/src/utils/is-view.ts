import { ApplicationRoute } from '@/src/types/routes';

export const isAssetView = (view?: ApplicationRoute): boolean => {
  return view === ApplicationRoute.Prompts || view === ApplicationRoute.Files || isDeploymentAsset(view);
};

export const isAssetWithVersion = (view?: ApplicationRoute): boolean => {
  return view === ApplicationRoute.Prompts || isDeploymentAsset(view);
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

export const isEntitiesWithDisplayVersion = (view?: ApplicationRoute) => {
  return view === ApplicationRoute.Models || view === ApplicationRoute.Applications;
};

export const isEvaluationView = (view?: ApplicationRoute): boolean => {
  return view === ApplicationRoute.TestSuites || view === ApplicationRoute.Metrics || view === ApplicationRoute.Runs;
};

export const isDeploymentManagerView = (view?: ApplicationRoute): boolean => {
  return (
    view === ApplicationRoute.Images ||
    view === ApplicationRoute.McpContainers ||
    view === ApplicationRoute.ModelServings ||
    view === ApplicationRoute.InterceptorContainers ||
    view === ApplicationRoute.AdapterContainers
  );
};
