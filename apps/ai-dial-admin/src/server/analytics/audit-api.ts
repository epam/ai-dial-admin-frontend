import { DialActivity } from '@/src/models/activity-audit';
import { Token } from '@/src/models/auth';
import { AuditPageData, FilterDto, SortDto } from '@/src/models/request';
import { ServerActionResponse } from '@/src/models/server-action';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { BaseApi } from '@/src/server/base-api';

// The analytics service exposes its routes under a bare `v1/` prefix, unlike the admin and
// deployment-manager backends' `api/v1/` — see `analytics-data-api.ts`, which uses the same prefix.
export const ANALYTICS_API = 'v1';
export const ANALYTICS_ACTIVITIES_URL = `${ANALYTICS_API}/activities`;

export class AnalyticsAuditApi extends BaseApi {
  getActivitiesList(
    pageSize: number,
    pageNumber: number,
    token: Token,
    sorts: SortDto[],
    filters: FilterDto[],
  ): Promise<AuditPageData<DialActivity> | null> {
    return this.post(
      ANALYTICS_ACTIVITIES_URL,
      {
        pageSize,
        pageNumber,
        sorts,
        filters,
      },
      token,
    );
  }

  getActivityById(id: string, token: Token): Promise<ServerActionResponse<DialActivity>> {
    return this.getAction(`${ANALYTICS_ACTIVITIES_URL}/${id}`, token);
  }

  getRevisionDetails(url: string, token: Token): Promise<ActivityAuditEntity | null> {
    return this.get(`${ANALYTICS_API}${url}`, token);
  }
}
