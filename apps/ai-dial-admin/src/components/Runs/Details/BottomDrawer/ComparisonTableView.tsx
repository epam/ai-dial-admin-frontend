'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult } from '@/src/models/evaluation/run';

import FocusStrip from './FocusStrip';
import FullscreenDiffViewer from './FullscreenDiffViewer';
import SectionGroup from './SectionGroup';
import StatusBadge from './StatusBadge';
import { ComparisonRow, ComparisonSection, DiffViewState } from './models';

interface Props {
  sections: ComparisonSection[];
  activeDetail: AnalyticsResult | null;
  pinnedDetail: AnalyticsResult | null;
  spotlightedFields: Set<string>;
  onToggleSpotlight: (fieldKey: string) => void;
}

const ComparisonTableView: FC<Props> = ({
  sections,
  activeDetail,
  pinnedDetail,
  spotlightedFields,
  onToggleSpotlight,
}) => {
  const t = useI18n();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());
  const [diffViewState, setDiffViewState] = useState<DiffViewState | null>(null);

  const onOpenDiff = useCallback((row: ComparisonRow) => {
    setDiffViewState({
      fieldLabel: row.label,
      original: row.values[0]?.raw ?? '',
      modified: row.values[1]?.raw ?? '',
    });
  }, []);

  const onToggleSectionCollapse = useCallback((key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const onToggleCellExpand = useCallback((cellKey: string) => {
    setExpandedCells((prev) => {
      const next = new Set(prev);
      if (next.has(cellKey)) next.delete(cellKey);
      else next.add(cellKey);
      return next;
    });
  }, []);

  const hasTwoColumns = pinnedDetail != null && pinnedDetail.id !== activeDetail?.id;
  const details = useMemo(() => {
    const arr: AnalyticsResult[] = [];
    if (activeDetail) arr.push(activeDetail);
    if (pinnedDetail && hasTwoColumns) arr.push(pinnedDetail);
    return arr;
  }, [activeDetail, pinnedDetail, hasTwoColumns]);

  // Collect spotlighted rows with full keys for unambiguous removal
  const spotlightedRows = useMemo(() => {
    const rows: Array<ComparisonRow & { fullKey: string }> = [];
    for (const section of sections) {
      for (const row of section.rows) {
        const fullKey = `${section.key}:${row.fieldKey}`;
        if (spotlightedFields.has(fullKey)) {
          rows.push({ ...row, fullKey });
        }
      }
    }
    return rows;
  }, [sections, spotlightedFields]);

  return (
    <div className="animate-fadeIn flex flex-col h-full">
      <FocusStrip rows={spotlightedRows} onRemove={onToggleSpotlight} />
      <div className="flex-1 overflow-auto min-h-0">
        <div
          className="w-full dial-tiny-text grid"
          style={{
            gridTemplateColumns: `minmax(180px, auto) repeat(${details.length}, minmax(0, 1fr))`,
          }}
        >
          {/* Header row */}
          <div className="sticky top-0 z-10 bg-layer-1 text-left dial-caption-semi-text text-secondary font-medium px-3 py-1.5 border-b border-secondary">
            {t(RunsI18nKey.FieldColumn)}
          </div>
          {details.map((detail, idx) => (
            <div
              key={detail.id ?? idx}
              className="sticky top-0 z-10 bg-layer-1 text-left dial-caption-semi-text font-medium px-3 py-1.5 border-b border-secondary"
            >
              <div className="flex items-center gap-2">
                <DialEllipsisTooltip text={detail.testCaseName ?? detail.id ?? ''} className="text-primary" />
                <StatusBadge status={detail.executionStatus} />
                {detail.execDurationMs != null && <span className="text-secondary">{detail.execDurationMs}ms</span>}
              </div>
            </div>
          ))}

          {/* Section rows */}
          {sections.map((section) => {
            const isCollapsed = collapsedSections[section.key];
            return (
              <SectionGroup
                key={section.key}
                section={section}
                isCollapsed={isCollapsed}
                onToggle={() => onToggleSectionCollapse(section.key)}
                hasTwoColumns={hasTwoColumns}
                spotlightedFields={spotlightedFields}
                onToggleSpotlight={onToggleSpotlight}
                expandedCells={expandedCells}
                onToggleCellExpand={onToggleCellExpand}
                onOpenDiff={onOpenDiff}
              />
            );
          })}
        </div>
      </div>
      {diffViewState && (
        <FullscreenDiffViewer
          isOpen={true}
          fieldLabel={diffViewState.fieldLabel}
          original={diffViewState.original}
          modified={diffViewState.modified}
          originalLabel={activeDetail?.testCaseName ?? activeDetail?.id ?? ''}
          modifiedLabel={pinnedDetail?.testCaseName ?? pinnedDetail?.id ?? ''}
          onClose={() => setDiffViewState(null)}
        />
      )}
    </div>
  );
};

export default ComparisonTableView;
