import { ActivityAuditRevision } from '@/src/components/ActivityAudit/models';
import { DialActivity } from '@/src/models/activity-audit';
import { Token } from '@/src/models/auth';
import { AuditPageData, FilterDto, SortDto } from '@/src/models/request';
import { ServerActionResponse } from '@/src/models/server-action';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const ACTIVITIES_URL = `${API}/activities`;
export const ACTIVITY_AUDIT_URL = `${API}/history/revisions`;
export const ACTIVITY_AUDIT_ROLLBACK_URL = `${API}/history/rollback`;

export class ActivityAuditApi extends BaseApi {
  getActivitiesList(
    pageSize: number,
    pageNumber: number,
    token: Token | undefined,
    sorts: SortDto[],
    filters: FilterDto[],
  ): Promise<AuditPageData<DialActivity> | null> {
    return this.post(
      ACTIVITIES_URL,
      {
        pageSize,
        pageNumber,
        sorts,
        filters,
      },
      token,
    );
  }

  getActivityById(id: string, token: Token | undefined): Promise<ServerActionResponse<DialActivity>> {
    return this.getAction(`${ACTIVITIES_URL}/${id}`, token);
  }

  getRevisionDetails(url: string, token: Token | undefined): Promise<ActivityAuditEntity | null> {
    return this.get(`${API}${url}`, token);
  }

  getRevisions(
    pageSize: number,
    pageNumber: number,
    token: Token | undefined,
    sorts: SortDto[],
    filters: FilterDto[],
  ): Promise<ServerActionResponse<ActivityAuditRevision[]>> {
    return this.postAction(
      `${ACTIVITY_AUDIT_URL}`,
      {
        pageSize,
        pageNumber,
        sorts,
        filters,
      },
      token,
    );
  }

  getEntitiesForRevision(url: string, token: Token | undefined): Promise<ActivityAuditEntity[] | null> {
    return this.get(`${API}${url}`, token);
  }

  rollbackToRevision(revisionNumber: number | undefined, token: Token | undefined): Promise<ServerActionResponse> {
    return this.postAction(`${ACTIVITY_AUDIT_ROLLBACK_URL}`, { revisionNumber }, token);
  }
}
