import { ActivityAuditResourceType, ActivityAuditType, DiffStatus } from '@/src/types/activity-audit';

export interface DialActivity {
  activityType: ActivityAuditType;
  resourceType: ActivityAuditResourceType;
  resourceId: string;
  epochTimestampMs: number;
  initiatedAuthor: string;
  initiatedEmail: string;
  activityId: string;
  revision: number;
}

export interface ActivityAuditDiff {
  parameter: string;
  value: string;
  status?: DiffStatus;
}

export interface ActivityAuditDiffSection {
  current: ActivityAuditDiff[];
  compare: ActivityAuditDiff[];
}

export type ActivityAuditSection = Record<string, ActivityAuditDiffSection[]>;
