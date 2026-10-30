import { ResourceDependenciesI18nKey } from '@/src/constants/i18n';
import { ResourceAccess } from '@/src/models/dial/resource-dependency';

export interface DependencyFormValues {
  linkId: string;
  path: string;
  access: ResourceAccess[];
  isRequired: boolean;
}

export interface ValidationIssue {
  key: ResourceDependenciesI18nKey;
  params?: Record<string, string | number>;
}

export interface DependencyFormErrors {
  linkId?: ValidationIssue;
  path?: ValidationIssue;
  access?: ValidationIssue;
}

export interface ConsentViewState {
  isApproved: boolean;
  isStale: boolean;
  hasRecord: boolean;
  isApproveVisible: boolean;
  isReApproveVisible: boolean;
  isRevokeVisible: boolean;
  isApproveDisabled: boolean;
  isSavedDefinitionNoteVisible: boolean;
  isStaleNoteVisible: boolean;
}

export enum ConsentDialogType {
  Approve = 'approve',
  Revoke = 'revoke',
}
