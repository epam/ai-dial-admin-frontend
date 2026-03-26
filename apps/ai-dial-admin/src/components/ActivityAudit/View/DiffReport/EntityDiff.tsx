import { FC } from 'react';

import DiffLegend from '@/src/components/ActivityAudit/View/DiffReport/DiffLegend';
import DiffSection from '@/src/components/ActivityAudit/View/DiffReport/DiffSection';
import { createSectionFromDiffs } from '@/src/components/ActivityAudit/View/utils/generate-diffs';
import { ActivityAuditDiff } from '@/src/models/activity-audit';
import { ActivityAuditResourceType, CompareView, DiffView } from '@/src/types/activity-audit';

interface Props {
  currentEntity: Record<string, ActivityAuditDiff[]>;
  compareEntity: Record<string, ActivityAuditDiff[]>;
  type?: ActivityAuditResourceType;
  diffView?: DiffView;
  compareView?: CompareView;
}

const EntityDiff: FC<Props> = ({ currentEntity, compareEntity, type, diffView, compareView }) => {
  const sections = createSectionFromDiffs(currentEntity, compareEntity);
  return (
    <div className="flex flex-col size-full min-h-0 mt-8 pt-8">
      <div id="activity-audit-diff" className="flex-1 flex flex-row gap-4 w-full min-h-0 mb-4 overflow-auto">
        <div className="flex-1 flex flex-col gap-y-8 min-h-0">
          {Object.entries(sections).map(([key, value]) => (
            <DiffSection
              type={type}
              sections={value}
              name={key}
              key={key}
              diffView={diffView}
              compareView={compareView}
            />
          ))}
        </div>
      </div>
      {!!Object.keys(currentEntity)?.length && !!Object.keys(compareEntity)?.length && (
        <DiffLegend description={true} />
      )}
    </div>
  );
};

export default EntityDiff;
