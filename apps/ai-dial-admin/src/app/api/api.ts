import { ActivityAuditApi } from '@/src/server/entities/activity-audit-api';
import { AdaptersApi } from '@/src/server/entities/adapters-api';
import { AddonsApi } from '@/src/server/entities/addons-api';
import { ApplicationRunnersApi } from '@/src/server/entities/application-runners-api';
import { ApplicationsApi } from '@/src/server/entities/applications-api';
import { AssistantsApi } from '@/src/server/entities/assistants-api';
import { FilesApi } from '@/src/server/entities/files-api';
import { FoldersApi } from '@/src/server/entities/folders-api';
import { InterceptorsApi } from '@/src/server/entities/interceptors-api';
import { KeysApi } from '@/src/server/entities/keys-api';
import { ModelsApi } from '@/src/server/entities/models-api';
import { PromptsApi } from '@/src/server/entities/prompts-api';
import { PublicationsApi } from '@/src/server/entities/publications-api';
import { RolesApi } from '@/src/server/entities/roles-api';
import { RoutesApi } from '@/src/server/entities/routes-api';
import { TelemetryApi } from '@/src/server/telemetry-api';
import { ThemesApi } from '@/src/server/themes-api';
import { UtilityApi } from '@/src/server/utility-api';

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

export const addonsApi = new AddonsApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const assistantsApi = new AssistantsApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const telemetryApi = new TelemetryApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const routesApi = new RoutesApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const promptsApi = new PromptsApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const publicationsApi = new PublicationsApi({
  host: process.env.DIAL_ADMIN_API_URL,
});

export const filesApi = new FilesApi({
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
