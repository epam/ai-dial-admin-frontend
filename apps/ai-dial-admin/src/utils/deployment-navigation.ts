import { APPLICATIONS_PREFIX, MODELS_PREFIX, TOOLSETS_PREFIX } from '@/src/constants/publications-core';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { McpDeploymentRef, TestSuiteDeploymentRef } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { getModelNavigationName } from '@/src/utils/resolve-model-deployment-route';

export interface CatalogDeploymentRecord {
  model?: string;
  application?: string;
  reference?: string;
  displayName?: string;
}

export interface DeploymentNavigationEntity {
  name: string;
  path?: string;
}

export interface DeploymentNavigationTarget {
  route: ApplicationRoute;
  entity: DeploymentNavigationEntity;
}

interface ResolveCatalogDeploymentNavigationOptions {
  fallbackDisplayName?: string;
}

export interface ResolveDeploymentNavigationOptions {
  /** When set, overrides Entities Models for dial-model deployments (Catalog vs Entities). */
  modelRoute?: ApplicationRoute;
}

const stripApplicationsPrefix = (applicationPath: string): string =>
  applicationPath.startsWith(APPLICATIONS_PREFIX) ? applicationPath.slice(APPLICATIONS_PREFIX.length) : applicationPath;

const stripToolsetsPrefix = (toolsetPath: string): string =>
  toolsetPath.startsWith(TOOLSETS_PREFIX) ? toolsetPath.slice(TOOLSETS_PREFIX.length) : toolsetPath;

/**
 * MCP_TOOL suites reference asset toolsets (`toolsets/…`), asset applications (`applications/…`),
 * or MCP containers (flat id). Mirror the applications-prefix fallback used for DEPLOYMENT suites.
 */
export function resolveMcpDeploymentNavigationTarget(
  mcpDeploymentRef: McpDeploymentRef | null | undefined,
): DeploymentNavigationTarget | null {
  if (!mcpDeploymentRef || (!mcpDeploymentRef.id && !mcpDeploymentRef.name)) {
    return null;
  }

  const id = mcpDeploymentRef.id;
  const displayName = mcpDeploymentRef.name || id;

  if (id?.startsWith(TOOLSETS_PREFIX)) {
    return {
      route: ApplicationRoute.AssetsToolsets,
      entity: {
        name: displayName,
        path: stripToolsetsPrefix(id),
      },
    };
  }

  if (id?.startsWith(APPLICATIONS_PREFIX)) {
    return {
      route: ApplicationRoute.AssetsApplications,
      entity: {
        name: displayName,
        path: stripApplicationsPrefix(id),
      },
    };
  }

  return {
    route: ApplicationRoute.McpContainers,
    entity: { name: id || displayName },
  };
}

export function resolveCatalogDeploymentNavigation(
  deployment: CatalogDeploymentRecord | null | undefined,
  options: ResolveCatalogDeploymentNavigationOptions = {},
): DeploymentNavigationTarget | null {
  if (!deployment) {
    return null;
  }

  if (deployment.model) {
    return {
      route: ApplicationRoute.Models,
      entity: { name: deployment.model },
    };
  }

  if (deployment.application) {
    if (deployment.application === deployment.reference) {
      return {
        route: ApplicationRoute.Applications,
        entity: { name: deployment.application },
      };
    }

    return {
      route: ApplicationRoute.AssetsApplications,
      entity: {
        name: deployment.displayName ?? options.fallbackDisplayName ?? deployment.application,
        path: stripApplicationsPrefix(deployment.application),
      },
    };
  }

  return null;
}

export function resolveDeploymentNavigationTarget(
  deploymentRef: TestSuiteDeploymentRef,
  deploymentType: string | undefined,
  catalogDeployments: CatalogDeploymentRecord[] = [],
  options: ResolveDeploymentNavigationOptions = {},
): DeploymentNavigationTarget | null {
  if (!deploymentRef.id) {
    return null;
  }

  const catalogDeployment = catalogDeployments.find((item) => item.reference === deploymentRef.id);
  const fromCatalog = resolveCatalogDeploymentNavigation(catalogDeployment, {
    fallbackDisplayName: deploymentRef.name,
  });

  if (fromCatalog) {
    return fromCatalog;
  }

  if (deploymentRef.id.startsWith(APPLICATIONS_PREFIX)) {
    return {
      route: ApplicationRoute.AssetsApplications,
      entity: {
        name: deploymentRef.name ?? deploymentRef.id,
        path: stripApplicationsPrefix(deploymentRef.id),
      },
    };
  }

  if (deploymentRef.id.startsWith(MODELS_PREFIX)) {
    return {
      route: ApplicationRoute.PlatformModels,
      entity: { name: getModelNavigationName(deploymentRef.id) },
    };
  }

  if (deploymentType === DeploymentType.Model) {
    // Wait for async Catalog probe (`modelRoute`) before committing to Entities Models.
    if (options.modelRoute == null) {
      return null;
    }
    return {
      route: options.modelRoute,
      entity: { name: getModelNavigationName(deploymentRef.id) },
    };
  }

  if (deploymentType === DeploymentType.Application) {
    return {
      route: ApplicationRoute.Applications,
      entity: { name: deploymentRef.id },
    };
  }

  return null;
}
