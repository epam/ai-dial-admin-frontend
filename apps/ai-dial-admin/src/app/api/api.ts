import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { AnalyticsV2Api } from '@/src/server/analytics/analytics-v2-api';
import { BucketApi } from '@/src/server/core/bucket-api';
import { FilesCoreApi } from '@/src/server/core/files-core-api';
import { DeploymentAuditApi } from '@/src/server/deployments/audit-api';
import { DeploymentConfigApi } from '@/src/server/deployments/config';
import { ContainersApi } from '@/src/server/deployments/containers';
import { GlobalFirewallApi } from '@/src/server/deployments/global-firewall';
import { HuggingfaceApi } from '@/src/server/deployments/huggingface';
import { ImagesApi } from '@/src/server/deployments/images';
import { McpRegistryApi } from '@/src/server/deployments/mcp-registry';
import { NodePoolsApi } from '@/src/server/deployments/node-pools';
import { TopicApi } from '@/src/server/deployments/topics';
import { WhitelistApi } from '@/src/server/deployments/whitelist';
import { ActivityAuditApi } from '@/src/server/entities/activity-audit-api';
import { AdaptersApi } from '@/src/server/entities/adapters-api';
import { ApplicationRunnersApi } from '@/src/server/entities/application-runners-api';
import { ApplicationsApi } from '@/src/server/entities/applications-api';
import { AssetsApi } from '@/src/server/entities/assets/assets-api';
import { FoldersApi } from '@/src/server/entities/assets/folders-api';
import { CorePublicationsApi } from '@/src/server/entities/core-publications-api';
import { InterceptorTemplatesApi } from '@/src/server/entities/interceptor-templates-api';
import { InterceptorsApi } from '@/src/server/entities/interceptors-api';
import { KeysApi } from '@/src/server/entities/keys-api';
import { ModelsApi } from '@/src/server/entities/models-api';
import { RolesApi } from '@/src/server/entities/roles-api';
import { RoutesApi } from '@/src/server/entities/routes-api';
import { ToolsetsApi } from '@/src/server/entities/toolsets-api';
import { AnalyticsApi } from '@/src/server/eval/analytics-api';
import { DatasetsApi } from '@/src/server/eval/datasets-api';
import { MetricsApi } from '@/src/server/eval/metrics-api';
import { RunsApi } from '@/src/server/eval/runs-api';
import { StructuredQueryApi } from '@/src/server/eval/structured-query-api';
import { TestSuitesApi } from '@/src/server/eval/test-suites-api';
import { EnrichmentClients } from '@/src/server/publications/resolver/types';
import { TelemetryApi } from '@/src/server/telemetry-api';
import { ThemesApi } from '@/src/server/themes-api';
import { UtilityApi } from '@/src/server/utility-api';

// Admin APIs
export const modelsApi = new ModelsApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const applicationsApi = new ApplicationsApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const rolesApi = new RolesApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const keysApi = new KeysApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const applicationRunnersApi = new ApplicationRunnersApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const interceptorsApi = new InterceptorsApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const adaptersApi = new AdaptersApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const telemetryApi = new TelemetryApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const routesApi = new RoutesApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const foldersApi = new FoldersApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const utilityApi = new UtilityApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const themesApi = new ThemesApi();

export const activityAuditApi = new ActivityAuditApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const interceptorTemplatesApi = new InterceptorTemplatesApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const toolSetsApi = new ToolsetsApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const assetsApi = new AssetsApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

// Deployments management APIs
export const containersApi = new ContainersApi({
  host: process.env.DIAL_DEPLOYMENTS_API_URL,
});

export const imagesApi = new ImagesApi({
  host: process.env.DIAL_DEPLOYMENTS_API_URL,
});

export const topicApi = new TopicApi({
  host: process.env.DIAL_DEPLOYMENTS_API_URL,
});

export const whitelistApi = new WhitelistApi({
  host: process.env.DIAL_DEPLOYMENTS_API_URL,
});

export const huggingFaceApi = new HuggingfaceApi({
  host: process.env.DIAL_DEPLOYMENTS_API_URL,
});

export const mcpRegistryApi = new McpRegistryApi({
  host: process.env.DIAL_DEPLOYMENTS_API_URL,
});

export const nodePoolsApi = new NodePoolsApi({
  host: process.env.DIAL_DEPLOYMENTS_API_URL,
});

export const deploymentConfigApi = new DeploymentConfigApi({
  host: process.env.DIAL_DEPLOYMENTS_API_URL,
});

export const deploymentAuditApi = new DeploymentAuditApi({
  host: process.env.DIAL_DEPLOYMENTS_API_URL,
});

export const globalFirewallApi = new GlobalFirewallApi({
  host: process.env.DIAL_DEPLOYMENTS_API_URL,
});

/// Evaluation APIs
export const testSuitesApi = new TestSuitesApi({
  host: process.env.DIAL_EVAL_API_URL,
});

export const datasetsApi = new DatasetsApi({
  host: process.env.DIAL_EVAL_API_URL,
});

export const metricsApi = new MetricsApi({
  host: process.env.DIAL_EVAL_API_URL,
});

export const runsApi = new RunsApi({
  host: process.env.DIAL_EVAL_API_URL,
});

export const analyticsApi = new AnalyticsApi({
  host: process.env.DIAL_EVAL_API_URL,
});

export const structuredQueryApi = new StructuredQueryApi({
  host: process.env.DIAL_EVAL_API_URL,
});

export const analyticsV2Api = new AnalyticsV2Api({
  host: process.env.DIAL_ANALYTICS_API_URL,
});

// DIAL Core direct clients (publications migration)
export const bucketApi = new BucketApi({
  host: process.env.DIAL_CORE_API_URL,
});

export const filesCoreApi = new FilesCoreApi({
  host: process.env.DIAL_CORE_API_URL,
});

// Publications talk to DIAL Core directly. Per-resource enrichment (asset get/put)
// is still delegated to the admin BE in this phase (migrates with assets in Phase 2).
const publicationEnrichmentClients: EnrichmentClients = {
  getAsset: (token, path, type, etag) => assetsApi.getAssetWithEtag(token, path, type, etag),
  updateAsset: (token, asset, type, etag) =>
    assetsApi.updateAssetWithEtag(token, asset as AssetWithVersion, type, etag),
  getBucket: (token) => bucketApi.getBucket(token),
  getFileMetadata: (token, path) => filesCoreApi.getFileMetadata(token, path),
  uploadFile: (token, path, file) => filesCoreApi.uploadFile(token, path, file),
};

export const publicationsApi = new CorePublicationsApi(
  { host: process.env.DIAL_CORE_API_URL },
  publicationEnrichmentClients,
);
