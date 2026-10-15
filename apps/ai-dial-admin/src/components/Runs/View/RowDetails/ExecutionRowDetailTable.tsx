'use client';

import { ChangeEvent, FC, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import classNames from 'classnames';

import {
  ROW_DETAIL_HEADER_CELL_BASE,
  ROW_DETAIL_TABLE_SCROLL_PADDING_TOP,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/constants';
import {
  RowDetailFieldFilter,
  RowDetailValueFilter,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';
import TextFilterCell from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/TextFilterCell';
import { filterRowDetailSections } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/filter-row-detail-sections';
import { SECTION_I18N } from '@/src/components/Runs/Details/BottomDrawer/constants';
import { RowDetailField, RowDetailSection } from '@/src/components/Runs/Details/RowDetails/models';
import { scrollPivotToField } from '@/src/components/Runs/Details/RowDetails/utils/scroll-pivot-to-field';
import { EXECUTION_ROW_DETAIL_TABLE_GRID_TEMPLATE_COLUMNS } from '@/src/components/Runs/View/RowDetails/constants';
import ExecutionRowDetailSection from '@/src/components/Runs/View/RowDetails/ExecutionRowDetailSection';
import FullscreenValueViewer from '@/src/components/Runs/View/RowDetails/FullscreenValueViewer';
import { BasicI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  sections: RowDetailSection[];
  focusFieldKey?: string | null;
  focusRequestId?: number;
}

const ExecutionRowDetailTable: FC<Props> = ({ sections, focusFieldKey, focusRequestId = 0 }) => {
  const t = useI18n();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  const [fieldFilter, setFieldFilter] = useState<RowDetailFieldFilter | null>(null);
  const [valueSearchQuery, setValueSearchQuery] = useState('');
  const [valueFilter, setValueFilter] = useState<RowDetailValueFilter | null>(null);
  const [fullValueRow, setFullValueRow] = useState<RowDetailField | null>(null);

  const filteredSections = useMemo(
    () =>
      filterRowDetailSections(sections, {
        searchQuery: fieldSearchQuery,
        showDiffsOnly: false,
        fieldFilter,
        primarySearchQuery: valueSearchQuery,
        primaryValueFilter: valueFilter,
      }),
    [sections, fieldSearchQuery, fieldFilter, valueSearchQuery, valueFilter],
  );

  useLayoutEffect(() => {
    scrollPivotToField(scrollContainerRef.current, focusFieldKey);
  }, [focusFieldKey, focusRequestId, filteredSections]);

  const onToggleSection = useCallback((key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const onFieldSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFieldSearchQuery(event.target.value);
  }, []);

  const onValueSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setValueSearchQuery(event.target.value);
  }, []);

  const onCloseFullValue = useCallback(() => setFullValueRow(null), []);

  const searchPlaceholder = t(BasicI18nKey.Search);
  const filterTitle = t(RunsI18nKey.RunCompareFilterField);

  return (
    <div className="relative flex flex-row flex-1 min-h-0 rounded overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="flex-1 min-w-0 overflow-y-auto"
        style={{ scrollPaddingTop: ROW_DETAIL_TABLE_SCROLL_PADDING_TOP }}
      >
        <div
          className="w-full dial-tiny-text grid"
          style={{ gridTemplateColumns: EXECUTION_ROW_DETAIL_TABLE_GRID_TEMPLATE_COLUMNS }}
        >
          <div className={classNames(ROW_DETAIL_HEADER_CELL_BASE, 'dial-small-semi-text text-secondary')}>
            {t(RunsI18nKey.FieldColumn)}
          </div>
          <div className={classNames(ROW_DETAIL_HEADER_CELL_BASE, 'border-r-0 dial-small-semi-text text-secondary')}>
            {t(RunsI18nKey.ValueColumn)}
          </div>

          <TextFilterCell
            searchQuery={fieldSearchQuery}
            onSearchChange={onFieldSearchChange}
            searchPlaceholder={searchPlaceholder}
            filter={fieldFilter}
            onFilterChange={setFieldFilter}
            filterTitle={filterTitle}
          />
          <TextFilterCell
            searchQuery={valueSearchQuery}
            onSearchChange={onValueSearchChange}
            searchPlaceholder={searchPlaceholder}
            filter={valueFilter}
            onFilterChange={setValueFilter}
            filterTitle={filterTitle}
          />

          {filteredSections.map((section) => {
            const isCollapsed = collapsedSections[section.key];
            const sectionI18nKey = SECTION_I18N[section.key];
            const sectionLabel = sectionI18nKey ? t(sectionI18nKey) : section.label;

            return (
              <ExecutionRowDetailSection
                key={section.key}
                section={section}
                sectionLabel={sectionLabel}
                isCollapsed={!!isCollapsed}
                onToggle={() => onToggleSection(section.key)}
                failedLabel={t(RunsI18nKey.MetricFailedText)}
                openFullValueLabel={t(RunsI18nKey.OpenFullValue)}
                onOpenFullValue={setFullValueRow}
              />
            );
          })}
        </div>
      </div>
      {fullValueRow && (
        <FullscreenValueViewer
          isOpen
          fieldLabel={fullValueRow.label}
          value={fullValueRow.primaryRaw ?? ''}
          onClose={onCloseFullValue}
        />
      )}
    </div>
  );
};

export default ExecutionRowDetailTable;
