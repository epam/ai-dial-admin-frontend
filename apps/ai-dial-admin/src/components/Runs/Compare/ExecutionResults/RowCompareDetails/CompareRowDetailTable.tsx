'use client';

import { ChangeEvent, FC, useCallback, useMemo, useRef, useState } from 'react';

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
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/constants';
import {
  CompareRowDetailField,
  CompareRowDetailSection,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';
import { filterRowDetailSections } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/filter-row-detail-sections';
import CompareRunIndexBadge from '@/src/components/Runs/Compare/CompareRunIndexBadge';
import { RUN_COMPARE_PRIMARY_INDEX, RUN_COMPARE_SECONDARY_INDEX } from '@/src/components/Runs/Compare/constants';
import { SECTION_I18N } from '@/src/components/Runs/Details/BottomDrawer/constants';
import FullscreenDiffViewer from '@/src/components/Runs/Details/BottomDrawer/FullscreenDiffViewer';
import { DiffViewState } from '@/src/components/Runs/Details/BottomDrawer/models';
import { BasicI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  sections: CompareRowDetailSection[];
  primaryRunName: string;
  comparedRunName: string;
  hasComparedMatch: boolean;
}

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
          <div className={classNames(ROW_DETAIL_HEADER_CELL_BASE, 'dial-small-semi-text text-secondary')}>
            {t(RunsI18nKey.FieldColumn)}
          </div>
          <div className={classNames(ROW_DETAIL_HEADER_CELL_BASE, 'dial-small-semi-text min-w-0')}>
            <div className="flex items-center gap-2 min-w-0">
              <CompareRunIndexBadge runIndex={RUN_COMPARE_PRIMARY_INDEX} />
              <DialEllipsisTooltip text={primaryRunName} className="text-secondary" />
            </div>
          </div>
          <div className={classNames(ROW_DETAIL_HEADER_CELL_BASE, 'dial-small-semi-text min-w-0')}>
            <div className="flex items-center gap-2 min-w-0">
              <CompareRunIndexBadge runIndex={RUN_COMPARE_SECONDARY_INDEX} />
              <DialEllipsisTooltip
                text={hasComparedMatch ? comparedRunName : t(RunsI18nKey.RunCompareNoMatch)}
                className="text-secondary"
              />
            </div>
          </div>
          <div className={classNames(ROW_DETAIL_HEADER_CELL_BASE, 'dial-small-semi-text text-secondary')}>
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

export default CompareRowDetailTable;
