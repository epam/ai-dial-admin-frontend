import { APPLICATIONS_PREFIX } from '@/src/constants/publications-core';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { TestSuiteDeploymentRef } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';

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

const stripApplicationsPrefix = (applicationPath: string): string =>
  applicationPath.startsWith(APPLICATIONS_PREFIX) ? applicationPath.slice(APPLICATIONS_PREFIX.length) : applicationPath;

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

  if (deploymentType === DeploymentType.Model) {
    return {
      route: ApplicationRoute.Models,
      entity: { name: deploymentRef.id },
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
