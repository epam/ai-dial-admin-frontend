'use client';

import { FC, useRef } from 'react';

import DiffMiniMap from '@/src/components/Common/DiffMiniMap/DiffMiniMap';
import DiffLegend from '@/src/components/Common/DiffLegend/DiffLegend';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sections = createSectionFromDiffs(currentEntity, compareEntity);

  return (
    <div className="flex flex-col size-full min-h-0 mt-8 pt-8">
      <div className="relative flex-1 min-h-0 mb-4">
        <div
          ref={scrollContainerRef}
          id="activity-audit-diff"
          className="absolute inset-0 flex flex-row gap-4 overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex-1 flex flex-col gap-y-8 min-h-0 pr-6">
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
        <DiffMiniMap scrollContainerRef={scrollContainerRef} />
      </div>
      {!!Object.keys(currentEntity)?.length && !!Object.keys(compareEntity)?.length && (
        <DiffLegend description={true} />
      )}
    </div>
  );
};

export default EntityDiff;
