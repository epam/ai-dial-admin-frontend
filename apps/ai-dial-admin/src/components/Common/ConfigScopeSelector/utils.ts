import { ExportComponentType } from '@/src/types/export';

/** Shared by the Export and Import Config pages, so both offer the same sources in the same order. */
export const getConfigScopes = (
  isAdminApiEnabled: boolean,
  isDeploymentsEnabled: boolean,
  isAnalyticsEnabled: boolean,
): ExportComponentType[] => [
  ...(isAdminApiEnabled ? [ExportComponentType.ADMIN] : []),
  ...(isDeploymentsEnabled ? [ExportComponentType.DEPLOYMENTS] : []),
  ...(isAnalyticsEnabled ? [ExportComponentType.ANALYTICS] : []),
];
