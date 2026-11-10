import { AnalyticsEntityField } from '@/src/models/analytics/entity';

export const isProjectionOnly = (field: Pick<AnalyticsEntityField, 'projection_only'>): boolean =>
  field.projection_only === true;
