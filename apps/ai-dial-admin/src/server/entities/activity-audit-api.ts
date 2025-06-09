import { JWT } from 'next-auth/jwt';

import { DialActivity } from '@/src/models/dial/activity-audit';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { API } from '../api';
import { BaseApi } from '../base-api';
import { PageDto, SortDto, FilterDto } from '@/src/models/request';

export const ACTIVITIES_URL = `${API}/activities`;
export const ACTIVITY_AUDIT_URL = `${API}/history/revisions`;
export const ACTIVITY_AUDIT_QUERY_URL = `${ACTIVITY_AUDIT_URL}/query`;

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
}
