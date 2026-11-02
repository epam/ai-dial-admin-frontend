'use client';

import { ChangeEvent, FC, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';

import { SECTION_I18N } from '@/src/components/Runs/Details/BottomDrawer/constants';
import {
  ROW_DETAIL_FIELD_INDENT,
  ROW_DETAIL_FIELD_SCROLL_MARGIN_TOP,
  ROW_DETAIL_HEADER_CELL_BASE,
} from '@/src/components/Runs/Details/RowDetails/constants';
import {
  RowDetailField,
  RowDetailFieldFilter,
  RowDetailSection,
  RowDetailValueFilter,
} from '@/src/components/Runs/Details/RowDetails/models';
import SectionHeaderRow from '@/src/components/Runs/Details/RowDetails/SectionHeaderRow';
import TextFilterCell from '@/src/components/Runs/Details/RowDetails/TextFilterCell';
import { filterRowDetailSections } from '@/src/components/Runs/Details/RowDetails/utils/filter-row-detail-sections';
import { scrollPivotToField } from '@/src/components/Runs/Details/RowDetails/utils/scroll-pivot-to-field';
import {
  EXECUTION_ROW_DETAIL_CELL_BASE,
  EXECUTION_ROW_DETAIL_GRID_TEMPLATE_COLUMNS,
  EXECUTION_ROW_DETAIL_SCROLL_PADDING_TOP,
} from '@/src/components/Runs/View/RowDetails/constants';
import ExpandableValueCell from '@/src/components/Runs/View/RowDetails/ExpandableValueCell';
import FullscreenValueViewer from '@/src/components/Runs/View/RowDetails/FullscreenValueViewer';
import { ExecutionRowDetailViewedValue } from '@/src/components/Runs/View/RowDetails/models';
import { BasicI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { mergeClasses } from '@/src/utils/merge-classes';

interface Props {
  sections: RowDetailSection[];
  focusFieldKey?: string | null;
  focusRequestId?: number;
}

const HEADER_CELL_CLASS = mergeClasses(ROW_DETAIL_HEADER_CELL_BASE, 'border-r-0 dial-small-semi-text text-secondary');
const FILTER_CELL_CLASS = 'h-10 border-r-0';

const ExecutionRowDetailTable: FC<Props> = ({ sections, focusFieldKey, focusRequestId = 0 }) => {
  const t = useI18n();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  const [fieldFilter, setFieldFilter] = useState<RowDetailFieldFilter | null>(null);
  const [valueSearchQuery, setValueSearchQuery] = useState('');
  const [valueFilter, setValueFilter] = useState<RowDetailValueFilter | null>(null);
  const [viewedValue, setViewedValue] = useState<ExecutionRowDetailViewedValue | null>(null);

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

  const onOpenValue = useCallback((field: RowDetailField) => {
    setViewedValue({ fieldLabel: field.label, value: field.primaryRaw ?? '' });
  }, []);

  const onCloseValue = useCallback(() => setViewedValue(null), []);

  const searchPlaceholder = t(BasicI18nKey.Search);
  const filterTitle = t(RunsI18nKey.RunCompareFilterField);

  return (
    <div className="relative flex flex-col flex-1 min-h-0 rounded overflow-hidden border border-secondary">
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto"
        style={{ scrollPaddingTop: EXECUTION_ROW_DETAIL_SCROLL_PADDING_TOP }}
      >
        <div
          className="w-full dial-tiny-text grid"
          style={{ gridTemplateColumns: EXECUTION_ROW_DETAIL_GRID_TEMPLATE_COLUMNS }}
        >
          <div className={HEADER_CELL_CLASS}>{t(RunsI18nKey.FieldColumn)}</div>
          <div className={HEADER_CELL_CLASS}>{t(RunsI18nKey.ValuesColumn)}</div>

          <TextFilterCell
            searchQuery={fieldSearchQuery}
            onSearchChange={onFieldSearchChange}
            searchPlaceholder={searchPlaceholder}
            filter={fieldFilter}
            onFilterChange={setFieldFilter}
            filterTitle={filterTitle}
            className={FILTER_CELL_CLASS}
          />
          <TextFilterCell
            searchQuery={valueSearchQuery}
            onSearchChange={onValueSearchChange}
            searchPlaceholder={searchPlaceholder}
            filter={valueFilter}
            onFilterChange={setValueFilter}
            filterTitle={filterTitle}
            className={FILTER_CELL_CLASS}
          />

          {filteredSections.map((section) => {
            const sectionI18nKey = SECTION_I18N[section.key];
            const sectionLabel = sectionI18nKey ? t(sectionI18nKey) : section.label;

            return (
              <SectionRows
                key={section.key}
                section={section}
                sectionLabel={sectionLabel}
                isCollapsed={collapsedSections[section.key] ?? false}
                onToggle={onToggleSection}
                onOpenValue={onOpenValue}
              />
            );
          })}
        </div>
      </div>
      {viewedValue && (
        <FullscreenValueViewer
          isOpen
          fieldLabel={viewedValue.fieldLabel}
          value={viewedValue.value}
          onClose={onCloseValue}
        />
      )}
    </div>
  );
};

interface SectionRowsProps {
  section: RowDetailSection;
  sectionLabel: string;
  isCollapsed: boolean;
  onToggle: (key: string) => void;
  onOpenValue: (field: RowDetailField) => void;
}

const SectionRows: FC<SectionRowsProps> = ({ section, sectionLabel, isCollapsed, onToggle, onOpenValue }) => {
  const onToggleSection = useCallback(() => onToggle(section.key), [onToggle, section.key]);

  return (
    <>
      <SectionHeaderRow
        label={<EllipsisTooltip text={sectionLabel} className="text-primary" />}
        isCollapsed={isCollapsed}
        onToggle={onToggleSection}
        iconSize={16}
        className="h-12 border-secondary"
        contentClassName="gap-2 text-primary"
      />
      {!isCollapsed &&
        section.rows.map((row) => (
          <div key={`${section.key}:${row.fieldKey}`} className="contents group">
            <div
              data-field-key={row.fieldKey}
              className={mergeClasses(
                EXECUTION_ROW_DETAIL_CELL_BASE,
                ROW_DETAIL_FIELD_INDENT,
                'group-hover:bg-accent-primary-alpha',
              )}
              style={{ scrollMarginTop: ROW_DETAIL_FIELD_SCROLL_MARGIN_TOP }}
            >
              <EllipsisTooltip text={row.label} className="dial-small-text text-primary min-w-0" />
            </div>
            <ExpandableValueCell field={row} onOpen={onOpenValue} />
          </div>
        ))}
    </>
  );
};

export default ExecutionRowDetailTable;
