import { Token } from '@/src/models/auth';
import { EnrichmentRoute, EnrichmentRoutesSettingDto } from '@/src/models/analytics/enrichment-routes';
import { ServerActionResponse } from '@/src/models/server-action';
import { ANALYTICS_API } from '@/src/server/analytics/audit-api';
import { BaseApi } from '@/src/server/base-api';

export const ENRICHMENT_ROUTES_URL = `${ANALYTICS_API}/settings/app-routes`;

const NOT_FOUND = 404;

const toRoutes = (result: ServerActionResponse<EnrichmentRoutesSettingDto>): ServerActionResponse<EnrichmentRoute[]> =>
  result.success && result.response
    ? { ...result, response: result.response.routes ?? [] }
    : { ...result, response: undefined };

export class EnrichmentRoutesApi extends BaseApi {
  async getRoutes(token: Token): Promise<ServerActionResponse<EnrichmentRoute[]>> {
    const read: ServerActionResponse<EnrichmentRoutesSettingDto> = await this.getAction(ENRICHMENT_ROUTES_URL, token);

    return !read.success && read.status === NOT_FOUND ? { success: true } : toRoutes(read);
  }

  async putRoutes(routes: EnrichmentRoute[], token: Token): Promise<ServerActionResponse<EnrichmentRoute[]>> {
    return toRoutes(await this.putAction(ENRICHMENT_ROUTES_URL, { routes }, token));
  }
}
