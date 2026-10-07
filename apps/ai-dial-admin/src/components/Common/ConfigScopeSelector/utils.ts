import { ExportComponentType } from '@/src/types/export';

/** Shared by the Export and Import Config pages, so both offer the same sources in the same order. */
export const getConfigScopes = (isDeploymentsEnabled: boolean, isAnalyticsEnabled: boolean): ExportComponentType[] => [
  ExportComponentType.ADMIN,
  ...(isDeploymentsEnabled ? [ExportComponentType.DEPLOYMENTS] : []),
  ...(isAnalyticsEnabled ? [ExportComponentType.ANALYTICS] : []),
];
