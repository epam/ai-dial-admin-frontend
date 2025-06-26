import { JWT } from 'next-auth/jwt';

import { DialActivity } from '@/src/models/dial/activity-audit';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { API } from '../api';
import { BaseApi } from '../base-api';
import { PageDto, SortDto, FilterDto } from '@/src/models/request';
import { ActivityAuditRevision } from '@/src/components/ActivityAudit/models';

export const ACTIVITIES_URL = `${API}/activities`;
export const ACTIVITY_AUDIT_URL = `${API}/history/revisions`;
export const ACTIVITY_AUDIT_ROLLBACK_URL = `${API}/history/rollback`;

export class ActivityAuditApi extends BaseApi {
  getActivitiesList(
    pageSize: number,
    pageNumber: number,
    token: JWT | null,
    sorts: SortDto[],
    filters: FilterDto[],
  ): Promise<PageDto<DialActivity> | null> {
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

  getActivityById(id: string, token: JWT | null): Promise<DialActivity | null> {
    return this.get(`${ACTIVITIES_URL}/${id}`, token);
  }

  getRevisionDetails(url: string, token: JWT | null): Promise<ActivityAuditEntity | null> {
    return this.get(`${API}${url}`, token);
  }

  getRevisions(
    pageSize: number,
    pageNumber: number,
    token: JWT | null,
    sorts: SortDto[],
    filters: FilterDto[],
  ): Promise<ActivityAuditRevision[] | null> {
    return this.post(
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

  getEntitiesForRevision(url: string, token: JWT | null): Promise<ActivityAuditEntity[] | null> {
    return this.get(`${API}${url}`, token);
  }

  rollbackToRevision(revisionNumber: number | undefined, token: JWT | null) {
    return this.post(`${ACTIVITY_AUDIT_ROLLBACK_URL}`, { revisionNumber }, token);
  }
}
