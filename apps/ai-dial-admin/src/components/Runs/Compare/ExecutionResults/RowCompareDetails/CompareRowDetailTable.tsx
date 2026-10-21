'use client';

import { ChangeEvent, FC, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import classNames from 'classnames';
import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import DiffMiniMap from '@/src/components/Common/DiffMiniMap/DiffMiniMap';
import { DEFAULT_COMPARE_DELTA_HEADER } from '@/src/components/Runs/Compare/ExecutionResults/constants';
import FilterRow from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/FilterRow';
import SectionRows from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/SectionRows';
import {
  ROW_DETAIL_GRID_TEMPLATE_COLUMNS,
  ROW_DETAIL_HEADER_CELL_BASE,
  ROW_DETAIL_MINIMAP_COL_WIDTH,
  ROW_DETAIL_TABLE_SCROLL_PADDING_TOP,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/constants';
import {
  RowDetailDeltaFilter,
  RowDetailFieldFilter,
  RowDetailRunFilter,
  RowDetailValueFilter,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';
import { filterRowDetailSections } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/filter-row-detail-sections';
import { RowDetailField, RowDetailSection } from '@/src/components/Runs/Details/RowDetails/models';
import { scrollPivotToField } from '@/src/components/Runs/Details/RowDetails/utils/scroll-pivot-to-field';
import CompareRunIndexBadge from '@/src/components/Runs/Compare/CompareRunIndexBadge';
import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';
import { CompareRun } from '@/src/components/Runs/Compare/models';
import { getRowDetailRunValue } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/run-field-values';
import { SECTION_I18N } from '@/src/components/Runs/Details/BottomDrawer/constants';
import FullscreenDiffViewer from '@/src/components/Runs/Details/BottomDrawer/FullscreenDiffViewer';
import { DiffViewState } from '@/src/components/Runs/Details/BottomDrawer/models';
import { BasicI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  sections: RowDetailSection[];
  runs: CompareRun[];
  hasComparedMatch: boolean;
  showDiffsOnly: boolean;
  hideHighlights: boolean;
  focusFieldKey?: string | null;
  focusRequestId?: number;
}

const CompareRowDetailTable: FC<Props> = ({
  sections,
  runs,
  hasComparedMatch,
  showDiffsOnly,
  hideHighlights,
  focusFieldKey,
  focusRequestId = 0,
}) => {
  const t = useI18n();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [fieldFilter, setFieldFilter] = useState<RowDetailFieldFilter | null>(null);
  const [valueSearchQueries, setValueSearchQueries] = useState<Record<CompareRunSlot, string>>({
    [CompareRunSlot.Primary]: '',
    [CompareRunSlot.Secondary]: '',
  });
  const [valueFilters, setValueFilters] = useState<Record<CompareRunSlot, RowDetailValueFilter | null>>({
    [CompareRunSlot.Primary]: null,
    [CompareRunSlot.Secondary]: null,
  });
  const [deltaFilter, setDeltaFilter] = useState<RowDetailDeltaFilter | null>(null);
  const [diffView, setDiffView] = useState<DiffViewState | null>(null);

  const filteredSections = useMemo(
    () =>
      filterRowDetailSections(sections, {
        searchQuery,
        showDiffsOnly,
        fieldFilter,
        primarySearchQuery: valueSearchQueries[CompareRunSlot.Primary],
        primaryValueFilter: valueFilters[CompareRunSlot.Primary],
        secondarySearchQuery: valueSearchQueries[CompareRunSlot.Secondary],
        secondaryValueFilter: valueFilters[CompareRunSlot.Secondary],
        deltaFilter,
      }),
    [sections, searchQuery, showDiffsOnly, fieldFilter, valueSearchQueries, valueFilters, deltaFilter],
  );

  useLayoutEffect(() => {
    scrollPivotToField(scrollContainerRef.current, focusFieldKey);
  }, [focusFieldKey, focusRequestId, filteredSections]);

  const onToggleSection = useCallback((key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const onSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const runFilters = useMemo<RowDetailRunFilter[]>(
    () =>
      runs.map(({ slot }) => ({
        slot,
        searchQuery: valueSearchQueries[slot],
        onSearchChange: (event: ChangeEvent<HTMLInputElement>) =>
          setValueSearchQueries((prev) => ({ ...prev, [slot]: event.target.value })),
        filter: valueFilters[slot],
        onFilterChange: (filter: RowDetailValueFilter | null) =>
          setValueFilters((prev) => ({ ...prev, [slot]: filter })),
      })),
    [runs, valueSearchQueries, valueFilters],
  );

  const getRunLabel = (run: CompareRun) =>
    run.slot === CompareRunSlot.Secondary && !hasComparedMatch ? t(RunsI18nKey.RunCompareNoMatch) : run.name;

  const onOpenDiff = useCallback(
    (row: RowDetailField) => {
      const [original, modified] = [runs[0], runs[runs.length - 1]].map(
        (run) => getRowDetailRunValue(row, run.slot).raw ?? '',
      );
      setDiffView({ fieldLabel: row.label, original, modified });
    },
    [runs],
  );

  const onCloseDiff = useCallback(() => setDiffView(null), []);

  return (
    <div className="relative flex flex-row flex-1 min-h-0 rounded overflow-hidden gap-2">
      <div
        ref={scrollContainerRef}
        className="flex-1 min-w-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollPaddingTop: ROW_DETAIL_TABLE_SCROLL_PADDING_TOP }}
      >
        <div className="w-full dial-tiny-text grid" style={{ gridTemplateColumns: ROW_DETAIL_GRID_TEMPLATE_COLUMNS }}>
          <div className={classNames(ROW_DETAIL_HEADER_CELL_BASE, 'dial-small-semi-text text-secondary')}>
            {t(RunsI18nKey.FieldColumn)}
          </div>
          {runs.map((run) => (
            <div key={run.slot} className={classNames(ROW_DETAIL_HEADER_CELL_BASE, 'dial-small-semi-text min-w-0')}>
              <div className="flex items-center gap-2 min-w-0">
                <CompareRunIndexBadge runIndex={run.index} />
                <DialEllipsisTooltip text={getRunLabel(run)} className="text-secondary" />
              </div>
            </div>
          ))}
          <div className={classNames(ROW_DETAIL_HEADER_CELL_BASE, 'dial-small-semi-text text-secondary')}>
            {DEFAULT_COMPARE_DELTA_HEADER}
          </div>
          <div className={classNames(ROW_DETAIL_HEADER_CELL_BASE, 'border-r-0 bg-layer-1')} aria-hidden />

          <FilterRow
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            searchPlaceholder={t(BasicI18nKey.Search)}
            fieldFilter={fieldFilter}
            onFieldFilterChange={setFieldFilter}
            runFilters={runFilters}
            deltaFilter={deltaFilter}
            onDeltaFilterChange={setDeltaFilter}
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
                hideHighlights={hideHighlights}
                runs={runs}
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
          originalLabel={getRunLabel(runs[0])}
          modifiedLabel={getRunLabel(runs[runs.length - 1])}
          onClose={onCloseDiff}
        />
      )}
    </div>
  );
};

export default CompareRowDetailTable;
