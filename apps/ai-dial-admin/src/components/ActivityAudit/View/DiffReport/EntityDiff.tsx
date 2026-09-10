'use client';

import { FC, useRef } from 'react';

import { DialNoDataContent } from '@epam/ai-dial-ui-kit';

import DiffMiniMap from '@/src/components/Common/DiffMiniMap/DiffMiniMap';
import DiffLegend from '@/src/components/Common/DiffLegend/DiffLegend';
import DiffSection from '@/src/components/ActivityAudit/View/DiffReport/DiffSection';
import { createSectionFromDiffs } from '@/src/components/ActivityAudit/View/utils/generate-diffs';
import { ActivityAuditDiff } from '@/src/models/activity-audit';
import { ActivityAuditI18nKey } from '@/src/constants/i18n';
import { ActivityAuditResourceType, CompareView, DiffView } from '@/src/types/activity-audit';
import { useI18n } from '@/src/locales/client';

interface Props {
  currentEntity: Record<string, ActivityAuditDiff[]>;
  compareEntity: Record<string, ActivityAuditDiff[]>;
  type?: ActivityAuditResourceType;
  diffView?: DiffView;
  compareView?: CompareView;
}

const EntityDiff: FC<Props> = ({ currentEntity, compareEntity, type, diffView, compareView }) => {
  const t = useI18n();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sections = createSectionFromDiffs(currentEntity, compareEntity);
  const hasSections = Object.keys(sections).length > 0;

  return (
    <div className="flex flex-col size-full min-h-0 mt-8 pt-8">
      {hasSections ? (
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
      ) : (
        <div role="status" className="flex flex-1 min-h-0 mb-4 items-center justify-center">
          <DialNoDataContent title={t(ActivityAuditI18nKey.SnapshotUnavailableTitle)} />
        </div>
      )}
      {hasSections && <DiffLegend description={true} />}
    </div>
  );
};

export default EntityDiff;
