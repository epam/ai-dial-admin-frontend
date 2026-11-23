import {
  EnrichmentRoute,
  EnrichmentRouteProblem,
  EnrichmentRouteRow,
  EnrichmentRouteRowProblems,
  EnrichmentRouteSuggestions,
} from '@/src/models/analytics/enrichment-routes';
import { DialApplication } from '@/src/models/dial/application';

const MAX_ROUTES = 100;
const MAX_LENGTH = 256;
const ROUTE_GRAMMAR = /^[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*$/;
const FORBIDDEN_IN_DEPLOYMENT = /[\s\p{Z}\p{Cc}\p{Cf}\\?#%]/u;
const DOT_SEGMENTS = ['.', '..'];

let counter = 0;
const nextRowId = (): string => `enrichment-route-${++counter}`;

export const createRouteRow = (pair: EnrichmentRoute = { deployment: '', route: '' }): EnrichmentRouteRow => ({
  id: nextRowId(),
  deployment: pair.deployment,
  route: pair.route,
});

export const toRouteRows = (routes: EnrichmentRoute[] = []): EnrichmentRouteRow[] =>
  routes.map((pair) => createRouteRow(pair));

export const isBlankRoute = ({ deployment, route }: EnrichmentRoute): boolean => !deployment.trim() && !route.trim();

export const toRoutePairs = (rows: EnrichmentRoute[]): EnrichmentRoute[] =>
  rows.filter((row) => !isBlankRoute(row)).map(({ deployment, route }) => ({ deployment, route }));

const hasBrokenSegment = (path: string): boolean =>
  path.split('/').some((segment) => !segment || DOT_SEGMENTS.includes(segment));

export const getDeploymentProblem = (deployment: string): EnrichmentRouteProblem | undefined => {
  if (!deployment.trim()) return EnrichmentRouteProblem.DeploymentRequired;
  if (deployment.length > MAX_LENGTH) return EnrichmentRouteProblem.DeploymentTooLong;
  if (FORBIDDEN_IN_DEPLOYMENT.test(deployment)) return EnrichmentRouteProblem.DeploymentForbidden;
  if (hasBrokenSegment(deployment)) return EnrichmentRouteProblem.DeploymentMalformed;
  return undefined;
};

export const getRouteProblem = (route: string): EnrichmentRouteProblem | undefined => {
  if (!route.trim()) return EnrichmentRouteProblem.RouteRequired;
  if (route.length > MAX_LENGTH) return EnrichmentRouteProblem.RouteTooLong;
  if (!ROUTE_GRAMMAR.test(route)) return EnrichmentRouteProblem.RouteMalformed;
  if (hasBrokenSegment(route)) return EnrichmentRouteProblem.RouteMalformed;
  return undefined;
};

const pairKey = ({ deployment, route }: EnrichmentRoute): string => JSON.stringify([deployment, route]);

export const getRouteRowProblems = (rows: EnrichmentRouteRow[]): Record<string, EnrichmentRouteRowProblems> => {
  const seen = new Set<string>();

  return rows.reduce<Record<string, EnrichmentRouteRowProblems>>((problems, row) => {
    if (isBlankRoute(row)) return problems;

    const deployment = getDeploymentProblem(row.deployment);
    const route = getRouteProblem(row.route);
    const key = pairKey(row);
    const isRepeated = !deployment && !route && seen.has(key);
    seen.add(key);

    if (deployment || route || isRepeated) {
      problems[row.id] = { deployment, route: isRepeated ? EnrichmentRouteProblem.Repeated : route };
    }

    return problems;
  }, {});
};

export const isRouteListFull = (rows: EnrichmentRoute[]): boolean => rows.length >= MAX_ROUTES;

export const isRouteListed = (routes: EnrichmentRoute[], deployment: string, route: string): boolean =>
  routes.some((pair) => pair.deployment === deployment && pair.route === route);

export const getRouteSuggestions = (suggestions: EnrichmentRouteSuggestions, deployment: string): string[] =>
  Object.hasOwn(suggestions.routesByDeployment, deployment) ? suggestions.routesByDeployment[deployment] : [];

const toRoutePath = (path: string): string => path.replace(/^\/+/, '');

export const toRouteSuggestions = (applications: DialApplication[] = []): EnrichmentRouteSuggestions =>
  applications.reduce<EnrichmentRouteSuggestions>(
    (suggestions, application) => {
      if (!application.name) return suggestions;

      const paths = (application.routes ?? []).flatMap((route) => route.paths ?? []).map(toRoutePath);

      suggestions.deployments.push(application.name);
      suggestions.routesByDeployment[application.name] = [...new Set(paths.filter(Boolean))];

      return suggestions;
    },
    { deployments: [], routesByDeployment: {} },
  );
