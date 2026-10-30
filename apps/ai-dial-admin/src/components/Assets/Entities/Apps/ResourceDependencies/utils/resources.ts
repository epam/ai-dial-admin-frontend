import { ApprovedResource, ResourceDependency } from '@/src/models/dial/resource-dependency';

export const toApprovedResources = (dependencies: ResourceDependency[] = []): ApprovedResource[] =>
  dependencies.map((dependency) => ({ path: dependency.target?.path ?? '', access: dependency.access ?? [] }));

export const formatResource = ({ path, access }: ApprovedResource): string =>
  access.length > 0 ? `${path} (${access.join(', ')})` : path;
