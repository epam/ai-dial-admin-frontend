import { DialActivity } from '@/src/models/activity-audit';
import { Token } from '@/src/models/auth';
import { AuditPageData, FilterDto, SortDto } from '@/src/models/request';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';

export const DEPLOYMENT_ACTIVITIES_URL = `${API}/activities`;

export class DeploymentAuditApi extends BaseApi {
  getActivitiesList(
    pageSize: number,
    pageNumber: number,
    token: Token,
    sorts: SortDto[],
    filters: FilterDto[],
  ): Promise<AuditPageData<DialActivity> | null> {
    return this.post(
      DEPLOYMENT_ACTIVITIES_URL,
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
    return this.getAction(`${DEPLOYMENT_ACTIVITIES_URL}/${id}`, token);
  }
}
