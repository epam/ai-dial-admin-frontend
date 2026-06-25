'use client';

import { ChangeEvent, FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { IconChevronDown, IconChevronRight, IconFilter, IconMaximize, IconSearch } from '@tabler/icons-react';
import classNames from 'classnames';
import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import DiffMiniMap from '@/src/components/Common/DiffMiniMap/DiffMiniMap';
import ExecutionStatusIcon from '@/src/components/Common/ExecutionStatusIcon/ExecutionStatusIcon';
import { parseExecutionStatus } from '@/src/components/Common/ExecutionStatusIcon/utils';
import ScoreBar from '@/src/components/Common/ScoreBar/ScoreBar';
import { SCORE_INDICATOR_COMPARE_WIDTH } from '@/src/components/Common/ScoreBar/constants';
import CompareMetricDeltaValue from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareMetricDeltaValue';
import { DEFAULT_COMPARE_DELTA_HEADER } from '@/src/components/Runs/Compare/ExecutionResults/constants';
import {
  ROW_DETAIL_CELL_BASE,
  ROW_DETAIL_FIELD_INDENT,
  ROW_DETAIL_FILTER_CELL_BASE,
  ROW_DETAIL_GRID_TEMPLATE_COLUMNS,
  ROW_DETAIL_HEADER_CELL_BASE,
  ROW_DETAIL_MINIMAP_COL_WIDTH,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/constants';
import {
  CompareRowDetailField,
  CompareRowDetailSection,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';
import { mergeClasses } from '@/src/utils/merge-classes';
import { filterRowDetailSections } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/filter-row-detail-sections';
import { getCompareDiffCellProps } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/row-detail-styles';
import CompareRunIndexBadge from '@/src/components/Runs/Compare/CompareRunIndexBadge';
import { RUN_COMPARE_PRIMARY_INDEX, RUN_COMPARE_SECONDARY_INDEX } from '@/src/components/Runs/Compare/constants';
import {
  EXECUTION_STATUS_FIELD_KEY,
  SECTION_I18N,
  TRUNCATE_THRESHOLD,
} from '@/src/components/Runs/Details/BottomDrawer/constants';
import FullscreenDiffViewer from '@/src/components/Runs/Details/BottomDrawer/FullscreenDiffViewer';
import { DiffViewState } from '@/src/components/Runs/Details/BottomDrawer/models';
import { formatFieldValue } from '@/src/components/Runs/Details/BottomDrawer/utils';
import { BasicI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  sections: CompareRowDetailSection[];
  primaryRunName: string;
  comparedRunName: string;
  hasComparedMatch: boolean;
}

const parseNumericRaw = (raw: string | null): number | null => {
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
};

const diffCellDataAttr = (props: ReturnType<typeof getCompareDiffCellProps>) =>
  props['data-compare-diff'] ? { 'data-compare-diff': props['data-compare-diff'] } : {};

const CompareRowDetailTable: FC<Props> = ({ sections, primaryRunName, comparedRunName, hasComparedMatch }) => {
  const t = useI18n();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showDiffsOnly, setShowDiffsOnly] = useState(false);
  const [diffView, setDiffView] = useState<DiffViewState | null>(null);

  const filteredSections = useMemo(
    () => filterRowDetailSections(sections, { searchQuery, showDiffsOnly }),
    [sections, searchQuery, showDiffsOnly],
  );

  const onToggleSection = useCallback((key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const onSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const onToggleDiffsOnly = useCallback(() => {
    setShowDiffsOnly((prev) => !prev);
  }, []);

  const onOpenDiff = useCallback((row: CompareRowDetailField) => {
    setDiffView({ fieldLabel: row.label, original: row.primaryRaw ?? '', modified: row.secondaryRaw ?? '' });
  }, []);

  const onCloseDiff = useCallback(() => setDiffView(null), []);

  return (
    <div className="relative flex flex-row flex-1 min-h-0 rounded overflow-hidden gap-2">
      <div
        ref={scrollContainerRef}
        className="flex-1 min-w-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="w-full dial-tiny-text grid" style={{ gridTemplateColumns: ROW_DETAIL_GRID_TEMPLATE_COLUMNS }}>
          <div className={classNames(ROW_DETAIL_HEADER_CELL_BASE, 'dial-small-text font-semibold text-secondary')}>
            {t(RunsI18nKey.FieldColumn)}
          </div>
          <div className={classNames(ROW_DETAIL_HEADER_CELL_BASE, 'dial-small-text font-semibold min-w-0')}>
            <div className="flex items-center gap-2 min-w-0">
              <CompareRunIndexBadge runIndex={RUN_COMPARE_PRIMARY_INDEX} />
              <DialEllipsisTooltip text={primaryRunName} className="text-secondary" />
            </div>
          </div>
          <div className={classNames(ROW_DETAIL_HEADER_CELL_BASE, 'dial-small-text font-semibold min-w-0')}>
            <div className="flex items-center gap-2 min-w-0">
              <CompareRunIndexBadge runIndex={RUN_COMPARE_SECONDARY_INDEX} />
              <DialEllipsisTooltip
                text={hasComparedMatch ? comparedRunName : t(RunsI18nKey.RunCompareNoMatch)}
                className="text-secondary"
              />
            </div>
          </div>
          <div className={classNames(ROW_DETAIL_HEADER_CELL_BASE, 'dial-small-text font-semibold text-secondary')}>
            {DEFAULT_COMPARE_DELTA_HEADER}
          </div>
          <div className={classNames(ROW_DETAIL_HEADER_CELL_BASE, 'border-r-0 bg-layer-1')} aria-hidden />

          <FilterRow
            searchQuery={searchQuery}
            showDiffsOnly={showDiffsOnly}
            onSearchChange={onSearchChange}
            onToggleDiffsOnly={onToggleDiffsOnly}
            searchPlaceholder={t(BasicI18nKey.Search)}
          />

          {filteredSections.map((section) => {
            const isCollapsed = collapsedSections[section.key];
            const sectionI18nKey = SECTION_I18N[section.key];
            const sectionLabel = sectionI18nKey ? t(sectionI18nKey) : section.label;

            return (
              <SectionRows
                key={section.key}
                section={section}
                sectionLabel={sectionLabel}
                isCollapsed={isCollapsed}
                onToggle={() => onToggleSection(section.key)}
                hasComparedMatch={hasComparedMatch}
                noMatchLabel={t(RunsI18nKey.RunCompareNoMatch)}
                failedLabel={t(RunsI18nKey.MetricFailedText)}
                onOpenDiff={onOpenDiff}
                openDiffLabel={t(RunsI18nKey.CompareFullscreen)}
              />
            );
          })}
        </div>
      </div>
      <div className="relative shrink-0" style={{ width: ROW_DETAIL_MINIMAP_COL_WIDTH }}>
        <DiffMiniMap scrollContainerRef={scrollContainerRef} />
      </div>
      {diffView && (
        <FullscreenDiffViewer
          isOpen
          fieldLabel={diffView.fieldLabel}
          original={diffView.original}
          modified={diffView.modified}
          originalLabel={primaryRunName}
          modifiedLabel={hasComparedMatch ? comparedRunName : t(RunsI18nKey.RunCompareNoMatch)}
          onClose={onCloseDiff}
        />
      )}
    </div>
  );
};

interface FilterRowProps {
  searchQuery: string;
  showDiffsOnly: boolean;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onToggleDiffsOnly: () => void;
  searchPlaceholder: string;
}

const FilterRow: FC<FilterRowProps> = ({
  searchQuery,
  showDiffsOnly,
  onSearchChange,
  onToggleDiffsOnly,
  searchPlaceholder,
}) => (
  <>
    <div className={classNames(ROW_DETAIL_FILTER_CELL_BASE, 'top-10 gap-2 pl-3 pr-2')}>
      <div className="flex-1 min-w-0 h-[23px] pl-2 flex flex-row items-center border border-primary rounded text-secondary">
        <IconSearch width={12} height={12} className="shrink-0" />
        <input
          type="text"
          className="w-full border-0 dial-tiny dial-input px-2 py-0 bg-transparent outline-none"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
      </div>
      <FilterToggleButton isActive={showDiffsOnly} onClick={onToggleDiffsOnly} />
    </div>
    <div className={classNames(ROW_DETAIL_FILTER_CELL_BASE, 'top-10')} aria-hidden />
    <div className={classNames(ROW_DETAIL_FILTER_CELL_BASE, 'top-10')} aria-hidden />
    <div className={classNames(ROW_DETAIL_FILTER_CELL_BASE, 'top-10 justify-center pl-3 pr-2')}>
      <FilterToggleButton isActive={showDiffsOnly} onClick={onToggleDiffsOnly} />
    </div>
    <div className={classNames(ROW_DETAIL_FILTER_CELL_BASE, 'top-10 border-r-0 bg-layer-1')} aria-hidden />
  </>
);

interface FilterToggleButtonProps {
  isActive: boolean;
  onClick: () => void;
}

const FilterToggleButton: FC<FilterToggleButtonProps> = ({ isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={classNames(
      'shrink-0 flex items-center justify-center size-[22px] rounded-sm',
      isActive ? 'text-accent-primary bg-accent-primary-alpha' : 'text-secondary hover:text-primary',
    )}
    aria-pressed={isActive}
  >
    <IconFilter size={16} />
  </button>
);

interface ExpandButtonProps {
  title: string;
  onClick: () => void;
  className?: string;
}

const ExpandButton: FC<ExpandButtonProps> = ({ title, onClick, className }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    className={classNames(
      'shrink-0 flex items-center justify-center size-[22px] rounded-sm text-secondary hover:text-primary',
      className,
    )}
  >
    <IconMaximize size={16} />
  </button>
);

interface SectionRowsProps {
  section: CompareRowDetailSection;
  sectionLabel: string;
  isCollapsed: boolean;
  onToggle: () => void;
  hasComparedMatch: boolean;
  noMatchLabel: string;
  failedLabel: string;
  onOpenDiff: (row: CompareRowDetailField) => void;
  openDiffLabel: string;
}

const SectionRows: FC<SectionRowsProps> = ({
  section,
  sectionLabel,
  isCollapsed,
  onToggle,
  hasComparedMatch,
  noMatchLabel,
  failedLabel,
  onOpenDiff,
  openDiffLabel,
}) => (
  <>
    <div
      className="cursor-pointer hover:bg-layer-2 p-3 border-b border-tertiary bg-layer-3"
      style={{ gridColumn: '1 / -1' }}
      onClick={onToggle}
    >
      <div className="flex items-center gap-1 dial-small-text text-secondary">
        {isCollapsed ? <IconChevronRight size={12} /> : <IconChevronDown size={12} />}
        {sectionLabel}
      </div>
    </div>
    {!isCollapsed &&
      section.rows.map((row) => (
        <DetailRow
          key={`${section.key}:${row.fieldKey}`}
          row={row}
          hasComparedMatch={hasComparedMatch}
          noMatchLabel={noMatchLabel}
          failedLabel={failedLabel}
          onOpenDiff={onOpenDiff}
          openDiffLabel={openDiffLabel}
        />
      ))}
  </>
);

interface DetailRowProps {
  row: CompareRowDetailField;
  hasComparedMatch: boolean;
  noMatchLabel: string;
  failedLabel: string;
  onOpenDiff: (row: CompareRowDetailField) => void;
  openDiffLabel: string;
}

const DetailRow: FC<DetailRowProps> = ({
  row,
  hasComparedMatch,
  noMatchLabel,
  failedLabel,
  onOpenDiff,
  openDiffLabel,
}) => {
  const [primaryOverflow, setPrimaryOverflow] = useState(false);
  const [secondaryOverflow, setSecondaryOverflow] = useState(false);

  const fieldProps = getCompareDiffCellProps(row.diffKind, 'field');
  const valueProps = getCompareDiffCellProps(row.diffKind, 'value');
  const deltaProps = getCompareDiffCellProps(row.diffKind, 'delta');
  const actionProps = getCompareDiffCellProps(row.diffKind, 'action');
  const showOpenDiff = primaryOverflow || secondaryOverflow;
  const isStatusRow = row.fieldKey === EXECUTION_STATUS_FIELD_KEY && !row.isMetric;

  return (
    <div className="contents group">
      <div
        className={mergeClasses(
          ROW_DETAIL_CELL_BASE,
          ROW_DETAIL_FIELD_INDENT,
          'pr-3 flex items-center',
          fieldProps.className,
        )}
        {...diffCellDataAttr(fieldProps)}
      >
        <DialEllipsisTooltip text={row.label} className="dial-small-text text-primary min-w-0" />
      </div>
      <div className={mergeClasses(ROW_DETAIL_CELL_BASE, valueProps.className)} {...diffCellDataAttr(valueProps)}>
        {isStatusRow ? (
          <StatusValue raw={row.primaryRaw} />
        ) : (
          <FieldValue
            raw={row.primaryRaw}
            isFailed={row.primaryFailed}
            isScoreIndicator={row.isScoreIndicator}
            failedLabel={failedLabel}
            onOverflowChange={setPrimaryOverflow}
          />
        )}
      </div>
      <div className={mergeClasses(ROW_DETAIL_CELL_BASE, valueProps.className)} {...diffCellDataAttr(valueProps)}>
        {hasComparedMatch ? (
          isStatusRow ? (
            <StatusValue raw={row.secondaryRaw} />
          ) : (
            <FieldValue
              raw={row.secondaryRaw}
              isFailed={row.secondaryFailed}
              isScoreIndicator={row.isScoreIndicator}
              failedLabel={failedLabel}
              onOverflowChange={setSecondaryOverflow}
            />
          )
        ) : (
          <span className="text-secondary dial-small-text">{noMatchLabel}</span>
        )}
      </div>
      <div className={mergeClasses(ROW_DETAIL_CELL_BASE, deltaProps.className)} {...diffCellDataAttr(deltaProps)}>
        {hasComparedMatch && row.isNumeric && row.isMetric ? (
          <CompareMetricDeltaValue primaryRaw={row.primaryRaw} secondaryRaw={row.secondaryRaw} />
        ) : null}
      </div>
      <div
        className={mergeClasses(
          ROW_DETAIL_CELL_BASE,
          'flex items-center justify-center border-r-0',
          actionProps.className,
        )}
        {...diffCellDataAttr(actionProps)}
      >
        {showOpenDiff ? (
          <ExpandButton
            title={openDiffLabel}
            onClick={() => onOpenDiff(row)}
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
          />
        ) : null}
      </div>
    </div>
  );
};

interface StatusValueProps {
  raw: string | null;
}

const StatusValue: FC<StatusValueProps> = ({ raw }) => {
  const status = parseExecutionStatus(raw);

  return (
    <div className="flex items-center gap-2">
      {status ? <ExecutionStatusIcon status={status} size={16} /> : null}
      <span className="text-primary dial-small-text">{formatFieldValue(raw)}</span>
    </div>
  );
};

interface FieldValueProps {
  raw: string | null;
  isFailed?: boolean;
  isScoreIndicator: boolean;
  failedLabel: string;
  onOverflowChange?: (overflowing: boolean) => void;
}

const FieldValue: FC<FieldValueProps> = ({ raw, isFailed, isScoreIndicator, failedLabel, onOverflowChange }) => {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) {
      onOverflowChange?.(false);
      return;
    }

    const check = () => onOverflowChange?.(el.scrollHeight > el.clientHeight);
    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [raw, isFailed, isScoreIndicator, onOverflowChange]);

  if (isFailed) {
    return <span className="text-error dial-small-text">{failedLabel}</span>;
  }

  const numericValue = parseNumericRaw(raw);

  if (isScoreIndicator && numericValue != null) {
    return (
      <div className="flex items-center gap-2">
        <ScoreBar value={numericValue} width={SCORE_INDICATOR_COMPARE_WIDTH} />
        <span className="text-primary dial-small-text shrink-0">{numericValue.toFixed(3)}</span>
      </div>
    );
  }

  const displayText = formatFieldValue(raw);
  const isLong = raw !== null && raw.length > TRUNCATE_THRESHOLD;

  return (
    <span
      ref={textRef}
      className={classNames('text-primary dial-small-text line-clamp-4 break-words', isLong && 'whitespace-pre-wrap')}
    >
      {displayText}
    </span>
  );
};

export default CompareRowDetailTable;
