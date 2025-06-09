import { FC } from 'react';

import { createSectionFromDiffs } from '@/src/components/ActivityAuditView/activity-audit.utils';
import { ActivityAuditDiff } from '@/src/models/dial/activity-audit';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import ActivityAuditEntityDiffLegend from './ActivityAuditEntityDiffLegend';
import ActivityAuditEntityDiffSection from './ActivityAuditEntityDiffSection';

interface Props {
  currentEntity: Record<string, ActivityAuditDiff[]>;
  compareEntity: Record<string, ActivityAuditDiff[]>;
  type?: ActivityAuditResourceType;
}

const ActivityAuditEntityDiff: FC<Props> = ({ currentEntity, compareEntity, type }) => {
  const sections = createSectionFromDiffs(currentEntity, compareEntity);
  return (
    <div className="flex flex-col w-full h-full min-h-0 mt-8 pt-8">
      <div id="activity-audit-diff" className="flex-1 flex flex-row gap-4 w-full min-h-0 mb-4 overflow-auto">
        <div className="flex-1 flex flex-col gap-6 min-h-0 ">
          {Object.entries(sections).map(([key, value]) => (
            <ActivityAuditEntityDiffSection type={type} sections={value} name={key} key={key} />
          ))}
        </div>
      </div>
      {!!Object.keys(currentEntity)?.length && !!Object.keys(compareEntity)?.length && (
        <ActivityAuditEntityDiffLegend description={true} />
      )}
    </div>
  );
};

export default ActivityAuditEntityDiff;
