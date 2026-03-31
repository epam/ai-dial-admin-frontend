'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { IconChevronDown, IconChevronRight, IconFocus2 } from '@tabler/icons-react';
import classNames from 'classnames';

import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult, ExtractionResultStatus } from '@/src/models/evaluation/run';

import FocusStrip from './FocusStrip';
import { ComparisonRow, ComparisonSection } from './types';
import { formatFieldValue, getDiffClass } from './utils';

interface Props {
  sections: ComparisonSection[];
  activeDetail: AnalyticsResult | null;
  pinnedDetail: AnalyticsResult | null;
  spotlightedFields: Set<string>;
  onToggleSpotlight: (fieldKey: string) => void;
}

const TRUNCATE_THRESHOLD = 500;
const PREVIEW_LENGTH = 200;

function StatusBadge({ status }: { status?: ExtractionResultStatus }) {
  if (!status) return null;
  const isSuccess = status === 'SUCCESS';
  return (
    <span className={classNames('text-xxs font-medium', isSuccess ? 'text-success' : 'text-error')}>{status}</span>
  );
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

  const toggleSectionCollapse = useCallback((key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleCellExpand = useCallback((cellKey: string) => {
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
    if (pinnedDetail && hasTwoColumns) arr.push(pinnedDetail);
    if (activeDetail) arr.push(activeDetail);
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
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-layer-1">
            <tr>
              <th className="text-left text-xxs text-secondary font-medium px-3 py-1.5 w-[180px] min-w-[180px] border-b border-secondary">
                {t(RunsI18nKey.FieldColumn)}
              </th>
              {details.map((detail, idx) => (
                <th
                  key={detail.id ?? idx}
                  className="text-left text-xxs font-medium px-3 py-1.5 border-b border-secondary"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-primary truncate">{detail.testCaseName ?? detail.id}</span>
                    <StatusBadge status={detail.executionStatus} />
                    {detail.execDurationMs != null && <span className="text-secondary">{detail.execDurationMs}ms</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => {
              const isCollapsed = collapsedSections[section.key];
              return (
                <SectionGroup
                  key={section.key}
                  section={section}
                  isCollapsed={isCollapsed}
                  onToggle={() => toggleSectionCollapse(section.key)}
                  hasTwoColumns={hasTwoColumns}
                  spotlightedFields={spotlightedFields}
                  onToggleSpotlight={onToggleSpotlight}
                  expandedCells={expandedCells}
                  onToggleCellExpand={toggleCellExpand}
                  columnCount={details.length}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface SectionGroupProps {
  section: ComparisonSection;
  isCollapsed: boolean;
  onToggle: () => void;
  hasTwoColumns: boolean;
  spotlightedFields: Set<string>;
  onToggleSpotlight: (fieldKey: string) => void;
  expandedCells: Set<string>;
  onToggleCellExpand: (cellKey: string) => void;
  columnCount: number;
}

const SectionGroup: FC<SectionGroupProps> = ({
  section,
  isCollapsed,
  onToggle,
  hasTwoColumns,
  spotlightedFields,
  onToggleSpotlight,
  expandedCells,
  onToggleCellExpand,
  columnCount,
}) => {
  const t = useI18n();
  return (
    <>
      <tr className="cursor-pointer hover:bg-layer-2" onClick={onToggle}>
        <td colSpan={1 + columnCount} className="px-3 py-1 border-b border-secondary">
          <div className="flex items-center gap-1 text-xxs font-semibold text-secondary uppercase">
            {isCollapsed ? <IconChevronRight size={12} /> : <IconChevronDown size={12} />}
            {section.label}
          </div>
        </td>
      </tr>
      {!isCollapsed &&
        section.rows.map((row) => {
          const fullKey = `${section.key}:${row.fieldKey}`;
          const isSpotlighted = spotlightedFields.has(fullKey);
          const diffClass = hasTwoColumns ? getDiffClass(row) : '';

          return (
            <tr key={fullKey} className="border-b border-secondary">
              <td className="px-3 py-1 align-top">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleSpotlight(fullKey)}
                    className={classNames(
                      'shrink-0',
                      isSpotlighted
                        ? 'text-accent-primary'
                        : 'text-secondary hover:text-primary opacity-0 group-hover:opacity-100',
                    )}
                    title={isSpotlighted ? t(RunsI18nKey.RemoveSpotlight) : t(RunsI18nKey.Spotlight)}
                  >
                    <IconFocus2 size={12} />
                  </button>
                  <span className="text-xxs font-mono text-primary truncate" title={row.label}>
                    {row.label}
                  </span>
                </div>
              </td>
              {row.values.map((val, idx) => {
                const cellKey = `${fullKey}:${idx}`;
                const isExpanded = expandedCells.has(cellKey);
                const raw = val.raw;
                const displayText = formatFieldValue(raw);
                const isLong = raw !== null && raw.length > TRUNCATE_THRESHOLD;
                const isActiveColumn = hasTwoColumns && idx === 1;
                const cellDiffClass = isActiveColumn ? diffClass : '';

                return (
                  <td key={idx} className={classNames('px-3 py-1 align-top', cellDiffClass)}>
                    <CellValue
                      text={displayText}
                      raw={raw}
                      isLong={isLong}
                      isExpanded={isExpanded}
                      cellKey={cellKey}
                      onToggleExpand={onToggleCellExpand}
                    />
                  </td>
                );
              })}
            </tr>
          );
        })}
    </>
  );
};

interface CellValueProps {
  text: string;
  raw: string | null;
  isLong: boolean;
  isExpanded: boolean;
  cellKey: string;
  onToggleExpand: (key: string) => void;
}

const CellValue: FC<CellValueProps> = ({ text, raw, isLong, isExpanded, cellKey, onToggleExpand }) => {
  const t = useI18n();
  if (raw === null) {
    return <span className="text-xxs text-secondary">—</span>;
  }

  const isJson = raw.includes('\n') || raw.length > 100;

  if (isLong && !isExpanded) {
    return (
      <div className="text-xxs text-primary">
        <span className="whitespace-pre-wrap break-words">{raw.slice(0, PREVIEW_LENGTH)}...</span>
        <button onClick={() => onToggleExpand(cellKey)} className="ml-1 text-accent-primary hover:underline">
          {t(RunsI18nKey.ShowMore)}
        </button>
      </div>
    );
  }

  if (isJson || isLong) {
    return (
      <pre className="text-xxs text-primary whitespace-pre-wrap break-words overflow-y-auto max-h-[180px] font-mono">
        {text}
      </pre>
    );
  }

  return <span className="text-xxs text-primary">{text}</span>;
};

export default ComparisonTableView;
