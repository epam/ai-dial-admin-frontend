import { ApplicationRoute } from '@/src/types/routes';

export const isAssetView = (view?: ApplicationRoute): boolean => {
  return (
    view === ApplicationRoute.Prompts ||
    view === ApplicationRoute.Files ||
    view === ApplicationRoute.Conversations ||
    view === ApplicationRoute.AssetsModels ||
    view === ApplicationRoute.AssetsAppRunners ||
    view === ApplicationRoute.AssetsInterceptors ||
    view === ApplicationRoute.AssetsSkills ||
    isDeploymentAsset(view)
  );
};

export const isAssetWithVersion = (view?: ApplicationRoute): boolean => {
  return view === ApplicationRoute.Prompts || isDeploymentAsset(view);
};

export const isDeploymentAsset = (view?: ApplicationRoute): boolean => {
  return view === ApplicationRoute.AssetsApplications || view === ApplicationRoute.AssetsToolsets;
};

/**
 * Surfaces that must not request the admin backend's topic catalogue.
 *
 * DIAL Core has no topic registry — a deployment's topics are a free `List<String>` — so there is no
 * Core equivalent to read, and the admin backend's catalogue is not a substitute on a surface whose
 * point is not depending on that service. The controls still seed from the resource and accept typed
 * entries, so this removes a suggestion list, not the ability to set topics.
 *
 * An explicit allow-list rather than a negation: `Assets > Applications` and `Assets > Toolsets` also
 * read their resource from Core but still use the catalogue, so "asset surface" is not the criterion.
 * Listing the surfaces that opt out means a new surface fails closed — it keeps the catalogue until
 * someone adds it here deliberately, rather than silently losing it.
 */
const VIEWS_WITHOUT_TOPIC_CATALOGUE: readonly ApplicationRoute[] = [
  ApplicationRoute.AssetsModels,
  ApplicationRoute.AssetsAppRunners,
  ApplicationRoute.AssetsInterceptors,
];

export const hasTopicCatalogue = (view?: ApplicationRoute): boolean => {
  return !view || !VIEWS_WITHOUT_TOPIC_CATALOGUE.includes(view);
};

export const isBuildersView = (view?: ApplicationRoute): boolean => {
  return (
    view === ApplicationRoute.Adapters ||
    view === ApplicationRoute.ApplicationRunners ||
    view === ApplicationRoute.InterceptorTemplates
  );
};

export const hasRelatedArtefacts = (view?: ApplicationRoute): boolean => {
  return isBuildersView(view) || view === ApplicationRoute.Datasets;
};

export const isEntitiesWithDisplayVersion = (view?: ApplicationRoute) => {
  return view === ApplicationRoute.Models || view === ApplicationRoute.Applications;
};

export const isApplicationView = (view?: ApplicationRoute): boolean => {
  return view === ApplicationRoute.Applications || view === ApplicationRoute.AssetsApplications;
};

export const isEvaluationView = (view?: ApplicationRoute): boolean => {
  return (
    view === ApplicationRoute.TestSuites ||
    view === ApplicationRoute.TestCases ||
    view === ApplicationRoute.Datasets ||
    view === ApplicationRoute.Metrics ||
    view === ApplicationRoute.Runs
  );
};

export const isToolsetRoute = (route?: ApplicationRoute): boolean => {
  return route === ApplicationRoute.Toolsets || route === ApplicationRoute.AssetsToolsets;
};

export const isDeploymentManagerView = (view?: ApplicationRoute): boolean => {
  return (
    view === ApplicationRoute.Images ||
    view === ApplicationRoute.McpContainers ||
    view === ApplicationRoute.ModelServings ||
    view === ApplicationRoute.InterceptorContainers ||
    view === ApplicationRoute.AdapterContainers ||
    view === ApplicationRoute.ApplicationContainers
  );
};
