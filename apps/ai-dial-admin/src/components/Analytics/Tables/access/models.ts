import { QueryFilterNode } from '@/src/models/analytics/query';
import { TableGrantKey } from '@/src/models/analytics/table';

export enum PrivilegeMark {
  Stored = 'stored',
  Implied = 'implied',
  None = 'none',
}

export type MarkedPrivilege = Exclude<TableGrantKey, TableGrantKey.Sensitive>;

export enum RowsCellKind {
  Policy = 'policy',
  All = 'all',
  None = 'none',
}

export interface RoleRow {
  role: string;
  marks: Record<MarkedPrivilege, PrivilegeMark>;
  isSensitive: boolean;
  rowsKind: RowsCellKind;
  filter?: QueryFilterNode;
}

// `get` is the stored flag: while `read` or `modify` is on, the Get card shows as held without changing it.
export interface RoleSelection {
  get: boolean;
  read: boolean;
  write: boolean;
  modify: boolean;
  sensitive: boolean;
}

export enum RowsMode {
  All = 'all',
  Some = 'some',
}

export enum DrawerPhase {
  Editing = 'editing',
  GrantsSavedWithBanner = 'grants-saved-with-banner',
  RowLimitFailed = 'row-limit-failed',
}

export enum AccessStatus {
  Loading = 'loading',
  Ready = 'ready',
  Forbidden = 'forbidden',
  Failed = 'failed',
}

export enum RowLimitView {
  Visual = 'visual',
  Json = 'json',
}

export enum RowLimitNote {
  TooDeep = 'too-deep',
  InvalidJson = 'invalid-json',
}
