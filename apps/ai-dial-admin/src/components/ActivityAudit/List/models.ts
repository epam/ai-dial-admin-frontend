import { ColDef } from 'ag-grid-community';

import { DialActivity } from '@/src/models/activity-audit';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { AuditPageData, FilterDto, SortDto } from '@/src/models/request';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';

/**
 * Signature shared by every activity-feed server action (`getActivities`,
 * `getDeploymentActivities`, `getAnalyticsActivities`), so a view config can name one
 * without the list knowing which backend answers it.
 */
export type ActivityAuditFetcher = (
  pageSize: number,
  pageNumber: number,
  sorts: SortDto[],
  filters: FilterDto[],
) => Promise<AuditPageData<DialActivity> | null>;

export type ActivityAuditRowAction = (activity?: DialActivity) => void;

export interface ActivityAuditColumnsParams {
  t: (key: string) => string;
  open?: ActivityAuditRowAction;
  onRollback?: ActivityAuditRowAction;
  isSingleEntity?: boolean;
}

export interface ActivityAuditHrefParams {
  entity?: BaseEntity | DialApplicationScheme;
  entityType?: ActivityAuditResourceType;
  activityId?: string;
}

export interface ActivityAuditViewConfig {
  fetchActivities: ActivityAuditFetcher;
  getColumns: (params: ActivityAuditColumnsParams) => ColDef[];
  hasParentChildAggregation: boolean;
  /**
   * Whether the view resolves each row's parent activity and drops the per-column children
   * of a table deletion. Only the analytics feed records those children.
   */
  hasDeletedParentSuppression: boolean;
  hasRollback: boolean;
  isRowNavigable: (resourceType?: string) => boolean;
  getEntityActivityHref: (params: ActivityAuditHrefParams) => string;
}
