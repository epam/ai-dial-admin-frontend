import { isEqual } from 'lodash';

import { ResourceDependency } from '@/src/models/dial/resource-dependency';
import { RESOURCE_DEPENDENCY_KIND } from '../constants';
import { DependencyFormValues } from '../models';
import { sortAccess } from './access';

export const toDependency = (values: DependencyFormValues): ResourceDependency => ({
  kind: RESOURCE_DEPENDENCY_KIND,
  link_id: values.linkId.trim(),
  target: { path: values.path.trim() },
  access: sortAccess(values.access),
  required: values.isRequired,
});

export const toFormValues = (dependency: ResourceDependency): DependencyFormValues => ({
  linkId: dependency.link_id,
  path: dependency.target?.path ?? '',
  access: sortAccess(dependency.access ?? []),
  isRequired: !!dependency.required,
});

export const addDependency = (
  dependencies: ResourceDependency[] | undefined,
  dependency: ResourceDependency,
): ResourceDependency[] => [...(dependencies ?? []), dependency];

export const replaceDependency = (
  dependencies: ResourceDependency[] | undefined,
  index: number,
  dependency: ResourceDependency,
): ResourceDependency[] => (dependencies ?? []).map((current, i) => (i === index ? dependency : current));

export const insertDependencyAfter = (
  dependencies: ResourceDependency[] | undefined,
  index: number,
  dependency: ResourceDependency,
): ResourceDependency[] => (dependencies ?? []).toSpliced(index + 1, 0, dependency);

// An empty declaration is `undefined`, so the property leaves the body just as Core omits an empty one.
export const removeDependency = (
  dependencies: ResourceDependency[] | undefined,
  index: number,
): ResourceDependency[] | undefined => {
  const remaining = (dependencies ?? []).filter((_, i) => i !== index);
  return remaining.length > 0 ? remaining : undefined;
};

export const isDeclarationDirty = (saved?: ResourceDependency[], draft?: ResourceDependency[]): boolean =>
  !isEqual(saved ?? [], draft ?? []);
