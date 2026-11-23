import { MouseEvent, MutableRefObject } from 'react';

import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { SavedQuery } from '@/src/models/analytics/saved-query';

export enum SourcePanelTab {
  Tables = 'tables',
  Queries = 'queries',
}

export enum QueryScopeFilter {
  All = 'all',
  Personal = 'personal',
  Common = 'common',
}

export enum QueryRowIndent {
  Root = 'root',
  BesideGroups = 'beside-groups',
  Nested = 'nested',
}

export enum ColumnLoadStatus {
  Loading = 'loading',
  Loaded = 'loaded',
  Failed = 'failed',
}

export interface SourceTable {
  name: string;
  description?: string;
  tagOrder?: string[];
}

export interface PendingNavigation {
  href: string;
  draftTable?: string;
}

export interface ColumnLoad {
  status: ColumnLoadStatus;
  fields: AnalyticsEntityField[];
}

export interface ColumnGroup {
  tag: string;
  fields: AnalyticsEntityField[];
}

export interface QueryGroup {
  tag: string;
  queries: SavedQuery[];
}

export interface QueryTree {
  groups: QueryGroup[];
  untagged: SavedQuery[];
}

export interface TableColumnTree {
  groups: ColumnGroup[];
  untagged: AnalyticsEntityField[];
}

export interface SourcePanelContextValue {
  tables: SourceTable[];
  queries: SavedQuery[];
  selectedTab: SourcePanelTab | null;
  onSelectTab: (tab: SourcePanelTab) => void;
  tableSearch: string;
  onChangeTableSearch: (value: string) => void;
  querySearch: string;
  onChangeQuerySearch: (value: string) => void;
  scopeFilter: QueryScopeFilter;
  onChangeScopeFilter: (scope: QueryScopeFilter) => void;
  expandedTables: string[];
  onToggleTable: (name: string) => void;
  collapsedGroups: string[];
  onToggleGroup: (key: string) => void;
  columns: Record<string, ColumnLoad>;
  onLoadColumns: (name: string) => void;
  scrollPositions: MutableRefObject<Partial<Record<SourcePanelTab, number>>>;
  isCollapsed: boolean;
  onToggleCollapsed: (isCollapsed: boolean) => void;
  draftTable: string | null;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, href: string, draftTable?: string) => void;
  onRegisterUnsavedWork: (hasUnsavedWork: boolean, onDiscard?: () => void) => void;
}
