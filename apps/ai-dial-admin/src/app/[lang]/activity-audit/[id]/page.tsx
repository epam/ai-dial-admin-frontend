import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { activityAuditApi } from '@/src/app/api/api';
import { SYSTEM_ROLLBACK_ID } from '@/src/components/ActivityAudit/Rollback/constants';
import SystemRollback from '@/src/components/ActivityAudit/Rollback/SystemRollback';
import AuditView from '@/src/components/ActivityAudit/View/AuditView';
import { DialActivity } from '@/src/models/activity-audit';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { FilterDto, AuditPageData } from '@/src/models/request';
import { errorObjLog } from '@/src/server/logger';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { SortDirectionDto } from '@/src/types/request';
import { getRevisionRouteForEntityType } from '@/src/utils/audit/get-revision-route';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let activity: DialActivity | null = null;
  let activityRevision: ActivityAuditEntity | null = null;
  let previousRevision: ActivityAuditEntity | null = null;
  let activities: AuditPageData<DialActivity> | null = null;
  let entity: BaseEntity | undefined = void 0;

  try {
    const auditViewId = decodeURIComponent((await params.params).id);
    if (auditViewId === SYSTEM_ROLLBACK_ID) {
      return <SystemRollback />;
    }
    activity = (await activityAuditApi.getActivityById(auditViewId, token)).response as DialActivity;
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

  if (activity == null) {
    notFound();
  }

  return (
    <AuditView
      activity={activity}
      activityRevision={activityRevision}
      previousRevision={previousRevision}
      entity={entity}
    />
  );
}
