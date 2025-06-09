import { ActivityAuditResourceType } from '@/src/types/activity-audit';

export const getFormattedResourceType = (value: string): string => {
  if (value === ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA) {
    return 'Application Runner';
  }
  return value;
};
