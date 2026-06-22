import { Token } from '@/src/models/auth';
import { FilterDto, SortDto } from '@/src/models/request';
import {
  ActivityAuditEntity,
  ActivityAuditResourceType,
  ActivityAuditType,
  DiffStatus,
} from '@/src/types/activity-audit';
import { ExternalRegistryRef } from '@/src/types/deployments/mcp-registry';

export interface DialActivity {
  activityType: ActivityAuditType;
  resourceType: ActivityAuditResourceType;
  resourceId: string;
  epochTimestampMs: number;
  initiatedAuthor: string;
  initiatedEmail: string;
  activityId: string;
  revision: number;
  parentActivityId?: string;
  action?: string;
  version?: string;
}

export interface ActivityAuditDiff {
  parameter: string;
  value: string;
  diffStatus?: DiffStatus;
  pairedValue?: string;
  mountType?: string;
  fileContent?: string;
  valueType?: string;
}

// Pre-diff row used by nested-flat handlers (resources, scaling, probe). Each
// entry maps a row parameter name to its rendered value plus optional metadata.
export interface FlatRow {
  parameter: string;
  value: string | undefined;
  mountType?: string;
}

export interface ActivityAuditDiffSection {
  current: ActivityAuditDiff[];
  compare: ActivityAuditDiff[];
}

export type ActivityAuditSection = Record<string, ActivityAuditDiffSection[]>;

// Diff-row factory used by `walkSortedArrayDiff` to emit allowed-domain /
// global-firewall-domain row pairs (matched / added / removed / placeholder).
export interface ArrayDiffRowFactory {
  match: (value: string) => ActivityAuditDiff;
  placeholder: () => ActivityAuditDiff;
  added: (value: string) => ActivityAuditDiff;
  removed: (value: string) => ActivityAuditDiff;
}

// Compare / fill pair registered in SEPARATE_OBJECT_HANDLERS for a given key.
export interface SeparateObjectHandler {
  compare: (diffs: ActivityAuditDiff[], val1: object, val2: object, isCurrent?: boolean) => void;
  fill: (diffs: ActivityAuditDiff[], value: object) => void;
}

// Loose shape of the `source` object inside an image / container snapshot.
// Used by `normalizeImageSource` to project external registry refs and
// collapse imageDefinition* fields into a single display row.
export type ImageSourceShape = Record<string, unknown> & {
  externalRegistryRef?: ExternalRegistryRef;
  imageDefinitionId?: string;
  imageDefinitionName?: string;
  imageDefinitionVersion?: string;
};

// Resolver bundle picked by `pickActivityHandlers` per activity branch
// (admin / image / firewall / container).
export interface ResolverHandlers {
  filter: (activity: DialActivity) => FilterDto[];
  fetchSnapshot: (activity: DialActivity, revision: number, token: Token) => Promise<ActivityAuditEntity | null>;
  listActivities: (filters: FilterDto[], token: Token) => Promise<{ data?: DialActivity[]; total?: number } | null>;
}

// Duck types for the API instances the resolver factories consume.
export interface RevisionApi {
  getRevisionDetails: (url: string, token: Token) => Promise<ActivityAuditEntity | null>;
}

export interface ListApi {
  getActivitiesList: (
    pageSize: number,
    pageNumber: number,
    token: Token,
    sorts: SortDto[],
    filters: FilterDto[],
  ) => Promise<{ data?: DialActivity[]; total?: number } | null>;
}

// Translation function signature used by audit value/parameter formatters.
export type TranslateFn = (key: string, params?: Record<string, string>) => string;

// Per-row value formatter signature in the container-row formatter registry.
export type ContainerValueFormatter = (value: string, t: TranslateFn) => string;

// Row-data shape that EnvVarValueCellRenderer reads from AG Grid's
// ICellRendererParams.data for environment-variable value cells.
export interface EnvVarRowData {
  mountType?: string;
  valueType?: string;
  fileContent?: string;
}
