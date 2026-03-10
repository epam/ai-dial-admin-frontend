import { ActivityAuditApi } from '@/src/server/entities/activity-audit-api';
import { AdaptersApi } from '@/src/server/entities/adapters-api';
import { ApplicationRunnersApi } from '@/src/server/entities/application-runners-api';
import { ApplicationsApi } from '@/src/server/entities/applications-api';
import { AssetsApi } from '@/src/server/entities/assets/assets-api';
import { FoldersApi } from '@/src/server/entities/assets/folders-api';
import { InterceptorTemplatesApi } from '@/src/server/entities/interceptor-templates-api';
import { InterceptorsApi } from '@/src/server/entities/interceptors-api';
import { KeysApi } from '@/src/server/entities/keys-api';
import { ModelsApi } from '@/src/server/entities/models-api';
import { PublicationsApi } from '@/src/server/entities/publications-api';
import { RolesApi } from '@/src/server/entities/roles-api';
import { RoutesApi } from '@/src/server/entities/routes-api';
import { ToolsetsApi } from '@/src/server/entities/toolsets-api';
import { TelemetryApi } from '@/src/server/telemetry-api';
import { ThemesApi } from '@/src/server/themes-api';
import { UtilityApi } from '@/src/server/utility-api';
import { ImagesApi } from '@/src/server/deployments/images';
import { ContainersApi } from '@/src/server/deployments/containers';
import { TopicApi } from '@/src/server/deployments/topics';
import { TestSuitesApi } from '@/src/server/eval/test-suites-api';
import { WhitelistApi } from '@/src/server/deployments/whitelist';
import { MetricsApi } from '@/src/server/eval/metrics-api';
import { HuggingfaceApi } from '@/src/server/deployments/huggingface';
import { DeploymentConfigApi } from '@/src/server/deployments/config';
import { RunsApi } from '@/src/server/eval/runs-api';

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

export const publicationsApi = new PublicationsApi({
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

export const deploymentConfigApi = new DeploymentConfigApi({
  host: process.env.DIAL_DEPLOYMENTS_API_URL,
});

/// Evaluation APIs
export const testSuitesApi = new TestSuitesApi({
  host: process.env.DIAL_EVAL_API_URL,
});

export const metricsApi = new MetricsApi({
  host: process.env.DIAL_EVAL_API_URL,
});

export const runsApi = new RunsApi({
  host: process.env.DIAL_EVAL_API_URL,
});
