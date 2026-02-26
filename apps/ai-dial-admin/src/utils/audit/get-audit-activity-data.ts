import { activityAuditApi } from '@/src/app/api/api';
import { DialActivity } from '@/src/models/activity-audit';
import { Token } from '@/src/models/auth';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { AuditPageData, FilterDto } from '@/src/models/request';
import { errorObjLog } from '@/src/server/logger';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { SortDirectionDto } from '@/src/types/request';
import { getRevisionRouteForEntityType } from '@/src/utils/audit/get-revision-route';

export const getAuditActivityData = async (activityId: string, token: Token) => {
  let activity: DialActivity | null = null;
  let activityRevision: ActivityAuditEntity | null = null;
  let previousRevision: ActivityAuditEntity | null = null;
  let activities: AuditPageData<DialActivity> | null = null;
  let entity: BaseEntity | undefined = void 0;

  try {
    activity = (await activityAuditApi.getActivityById(activityId, token)).response as DialActivity;
    activities = await activityAuditApi.getActivitiesList(
      1,
      0,
      token,
      [
        {
          column: 'epochTimestampMs',
          direction: SortDirectionDto.DESC,
        },
      ],
      [
        {
          column: 'resourceId',
          value: activity?.resourceId,
          operator: 'eq',
        } as FilterDto,
      ],
    );
    const route = getRevisionRouteForEntityType(
      activity?.resourceType,
      decodeURIComponent(activity?.resourceId as string),
    );

    if (activities && activities.data && route) {
      entity = (await activityAuditApi.getRevisionDetails(
        `${route}${activities.data?.[0].revision}`,
        token,
      )) as BaseEntity;
    }

    if (activity && route) {
      activityRevision = await activityAuditApi.getRevisionDetails(`${route}${activity.revision}`, token);
      previousRevision = await activityAuditApi.getRevisionDetails(`${route}${activity.revision - 1}`, token);
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch activity view data');
  }

  return {
    activity,
    activityRevision,
    previousRevision,
    entity,
  };
};
