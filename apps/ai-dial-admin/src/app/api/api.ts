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

export const containersApi = new ContainersApi({
  host: 'http://localhost:60614/',
});

export const imagesApi = new ImagesApi({
  host: 'http://localhost:60614/',
});

export const topicApi = new TopicApi({
  host: 'http://localhost:60614/',
});

export const whitelistApi = new WhitelistApi({
  host: 'http://localhost:60614/',
});

export const testSuitesApi = new TestSuitesApi({
  host: 'https://eval-swagger.aks.dev.dial.parts/',
});

export const metricsApi = new MetricsApi({
  host: 'https://eval-swagger.aks.dev.dial.parts/api/',
});
