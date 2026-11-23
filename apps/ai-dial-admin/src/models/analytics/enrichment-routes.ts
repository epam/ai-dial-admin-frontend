export interface EnrichmentRoute {
  deployment: string;
  route: string;
}

export interface EnrichmentRoutesSettingDto {
  routes: EnrichmentRoute[];
  updated_at?: string;
  updated_by?: string | null;
}

export interface EnrichmentRouteRow extends EnrichmentRoute {
  id: string;
}

export enum EnrichmentRouteProblem {
  DeploymentRequired = 'deploymentRequired',
  DeploymentTooLong = 'deploymentTooLong',
  DeploymentForbidden = 'deploymentForbidden',
  DeploymentMalformed = 'deploymentMalformed',
  RouteRequired = 'routeRequired',
  RouteTooLong = 'routeTooLong',
  RouteMalformed = 'routeMalformed',
  Repeated = 'repeated',
}

export interface EnrichmentRouteRowProblems {
  deployment?: EnrichmentRouteProblem;
  route?: EnrichmentRouteProblem;
}

export enum EnrichmentRoutesReadState {
  Listed = 'listed',
  NotStored = 'notStored',
  Unknown = 'unknown',
}

export interface EnrichmentRouteAllowlist {
  state: EnrichmentRoutesReadState;
  routes: EnrichmentRoute[];
}

export interface EnrichmentRouteSuggestions {
  deployments: string[];
  routesByDeployment: Record<string, string[]>;
}
