import { ResourceDependenciesI18nKey } from '@/src/constants/i18n';
import { ResourceAccess } from '@/src/models/dial/resource-dependency';
import {
  CURRENT_USER_PLACEHOLDER,
  DECLARABLE_TYPE_ROOTS,
  MAX_DECLARED_DEPENDENCIES,
  PERSONAL_TARGET_FORM,
} from '../constants';
import { DependencyFormErrors, DependencyFormValues, ValidationIssue } from '../models';

const PLACEHOLDER_SEGMENT_INDEX = 1;

// Core decodes declared paths before checking them, so the checks run on decoded segments — otherwise
// `%2e%2e` or `%2a` would pass here and only fail on Save. An undecodable segment is kept as is.
const decodeSegment = (segment: string): string => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

const getSegments = (path: string): string[] => {
  const withoutTrailingSlash = path.endsWith('/') ? path.slice(0, -1) : path;
  const segments = withoutTrailingSlash.split('/');
  while (segments.length > 0 && segments[segments.length - 1] === '') {
    segments.pop();
  }
  return segments.map(decodeSegment);
};

const getRootIssue = (segments: string[]): ValidationIssue | null => {
  const [root] = segments;
  if (root === 'users') {
    return { key: ResourceDependenciesI18nKey.PathUsers, params: { form: PERSONAL_TARGET_FORM } };
  }
  if (!DECLARABLE_TYPE_ROOTS.includes(root)) {
    return { key: ResourceDependenciesI18nKey.PathRoot, params: { roots: DECLARABLE_TYPE_ROOTS.join(', ') } };
  }
  if (segments.length < 2) {
    return { key: ResourceDependenciesI18nKey.PathTypeRoot, params: { type: root } };
  }
  return null;
};

const getSegmentIssue = (segment: string, index: number): ValidationIssue | null => {
  if (segment === CURRENT_USER_PLACEHOLDER && index !== PLACEHOLDER_SEGMENT_INDEX) {
    return {
      key: ResourceDependenciesI18nKey.PathPlaceholderPosition,
      params: { placeholder: CURRENT_USER_PLACEHOLDER },
    };
  }
  if (index === 0) {
    return null;
  }
  if (segment === '') {
    return { key: ResourceDependenciesI18nKey.PathEmptySegment };
  }
  if (segment.includes('*')) {
    return { key: ResourceDependenciesI18nKey.PathWildcard };
  }
  if (segment === '.' || segment === '..') {
    return { key: ResourceDependenciesI18nKey.PathRelative };
  }
  return null;
};

export const validateLinkId = (linkId: string, otherLinkIds: string[]): ValidationIssue | null => {
  const trimmed = linkId.trim();
  if (!trimmed) {
    return { key: ResourceDependenciesI18nKey.LinkIdRequired };
  }
  return otherLinkIds.includes(trimmed) ? { key: ResourceDependenciesI18nKey.LinkIdDuplicate } : null;
};

export const validatePath = (path: string): ValidationIssue | null => {
  const trimmed = path.trim();
  const segments = getSegments(trimmed);
  if (!trimmed || segments.length === 0) {
    return { key: ResourceDependenciesI18nKey.PathRequired };
  }
  const rootIssue = getRootIssue(segments);
  if (rootIssue) {
    return rootIssue;
  }
  for (let index = 0; index < segments.length; index++) {
    const issue = getSegmentIssue(segments[index], index);
    if (issue) {
      return issue;
    }
  }
  return null;
};

export const validateAccess = (access: ResourceAccess[]): ValidationIssue | null =>
  access.length > 0 ? null : { key: ResourceDependenciesI18nKey.AccessRequired };

export const validateDependency = (values: DependencyFormValues, otherLinkIds: string[]): DependencyFormErrors => {
  const errors: DependencyFormErrors = {};
  const linkIdIssue = validateLinkId(values.linkId, otherLinkIds);
  const pathIssue = validatePath(values.path);
  const accessIssue = validateAccess(values.access);
  if (linkIdIssue) {
    errors.linkId = linkIdIssue;
  }
  if (pathIssue) {
    errors.path = pathIssue;
  }
  if (accessIssue) {
    errors.access = accessIssue;
  }
  return errors;
};

export const hasDependencyErrors = (errors: DependencyFormErrors): boolean => Object.keys(errors).length > 0;

export const isDependencyLimitReached = (count: number): boolean => count >= MAX_DECLARED_DEPENDENCIES;
