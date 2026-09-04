'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'classnames';
import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import DiffMiniMap from '@/src/components/Common/DiffMiniMap/DiffMiniMap';
import { DEFAULT_COMPARE_DELTA_HEADER } from '@/src/components/Runs/Compare/ExecutionResults/constants';
import CompareMetricDeltaValue from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareMetricDeltaValue';
import PivotValueCell from '@/src/components/Runs/View/RowDetails/PivotValueCell';
import { getPivotGridTemplateColumns } from '@/src/components/Runs/Details/RowDetails/utils/pivot-column-width';
import { filterRowDetailSections } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/filter-row-detail-sections';
import { RowDetailField, RowDetailSection } from '@/src/components/Runs/Details/RowDetails/models';
import { flattenPivotFields } from '@/src/components/Runs/Details/RowDetails/utils/flatten-pivot-fields';
import { scrollPivotToField } from '@/src/components/Runs/Details/RowDetails/utils/scroll-pivot-to-field';
import {
  CompareDiffPivotPosition,
  getCompareDiffPivotCellProps,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/row-detail-styles';
import CompareRunIndexBadge from '@/src/components/Runs/Compare/CompareRunIndexBadge';
import { RUN_COMPARE_PRIMARY_INDEX, RUN_COMPARE_SECONDARY_INDEX } from '@/src/components/Runs/Compare/constants';
import { SECTION_I18N } from '@/src/components/Runs/Details/BottomDrawer/constants';
import FullscreenDiffViewer from '@/src/components/Runs/Details/BottomDrawer/FullscreenDiffViewer';
import { DiffViewState } from '@/src/components/Runs/Details/BottomDrawer/models';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { mergeClasses } from '@/src/utils/merge-classes';

interface Props {
  sections: RowDetailSection[];
  primaryRunName: string;
  comparedRunName: string;
  hasComparedMatch: boolean;
  showDiffsOnly: boolean;
  hideHighlights: boolean;
  focusFieldKey?: string | null;
}

const HEADER_CELL_BASE = 'h-10 px-3 flex items-center bg-layer-1 border-b border-secondary dial-small-semi-text';
const LEFT_CELL_STICKY = 'sticky left-0';
const VALUE_CELL_BASE = 'p-3 border-b border-r border-tertiary min-w-0 overflow-hidden h-10 flex items-center';

const CompareRowDetailPivotTable: FC<Props> = ({
  sections,
  primaryRunName,
  comparedRunName,
  hasComparedMatch,
  showDiffsOnly,
  hideHighlights,
  focusFieldKey,
}) => {
  const t = useI18n();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [diffView, setDiffView] = useState<DiffViewState | null>(null);

  const onOpenDiff = useCallback((field: RowDetailField) => {
    setDiffView({ fieldLabel: field.label, original: field.primaryRaw ?? '', modified: field.secondaryRaw ?? '' });
  }, []);

  const onCloseDiff = useCallback(() => setDiffView(null), []);

  const filteredSections = useMemo(
    () => filterRowDetailSections(sections, { searchQuery: '', showDiffsOnly }),
    [sections, showDiffsOnly],
  );

  const columns = useMemo(() => flattenPivotFields(filteredSections), [filteredSections]);

  const gridTemplateColumns = useMemo(() => getPivotGridTemplateColumns(columns), [columns]);

  useEffect(() => {
    scrollPivotToField(scrollContainerRef.current, focusFieldKey);
  }, [focusFieldKey, columns]);

  const renderValueCell = (
    key: string,
    field: RowDetailField,
    raw: string | null,
    isFailed: boolean,
    rowBg: string,
    position: CompareDiffPivotPosition,
  ) => {
    const diffKind = hideHighlights ? MetricDeltaKind.Empty : field.diffKind;
    const props = getCompareDiffPivotCellProps(diffKind, position);

    return (
      <PivotValueCell
        key={key}
        field={field}
        raw={raw}
        isFailed={isFailed}
        className={mergeClasses(rowBg, 'h-10 min-h-10 items-center self-auto', props.className)}
        data-compare-diff={props['data-compare-diff']}
        onOpenFullscreen={() => onOpenDiff(field)}
      />
    );
  };

  return (
    <div className="relative flex flex-col flex-1 min-h-0 rounded overflow-hidden gap-2">
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="dial-tiny-text grid w-max min-w-full" style={{ gridTemplateColumns }}>
          {/* Section header row */}
          <div className={classNames(HEADER_CELL_BASE, LEFT_CELL_STICKY, 'z-30 border-r')} aria-hidden />
          {columns.map((column) => {
            const sectionI18nKey = SECTION_I18N[column.sectionKey];
            const sectionLabel = sectionI18nKey ? t(sectionI18nKey) : column.sectionLabel;
            return (
              <div
                key={`section-${column.sectionKey}-${column.field.fieldKey}`}
                className={classNames(HEADER_CELL_BASE, 'text-secondary', column.isSectionStart ? 'border-l' : '')}
              >
                {column.isSectionStart ? <DialEllipsisTooltip text={sectionLabel} className="text-secondary" /> : null}
              </div>
            );
          })}

          {/* Field label row */}
          <div className={classNames(HEADER_CELL_BASE, LEFT_CELL_STICKY, 'z-30 border-r')} aria-hidden />
          {columns.map((column) => (
            <div
              key={`field-${column.sectionKey}-${column.field.fieldKey}`}
              className={classNames(HEADER_CELL_BASE, 'text-secondary border-r')}
            >
              <DialEllipsisTooltip text={column.field.label} className="text-secondary" />
            </div>
          ))}

          {/* Primary run row */}
          <div className={classNames(VALUE_CELL_BASE, LEFT_CELL_STICKY, 'z-20 bg-layer-3 gap-2')}>
            <CompareRunIndexBadge runIndex={RUN_COMPARE_PRIMARY_INDEX} />
            <DialEllipsisTooltip text={primaryRunName} className="text-primary" />
          </div>
          {columns.map((column) =>
            renderValueCell(
              `primary-${column.sectionKey}-${column.field.fieldKey}`,
              column.field,
              column.field.primaryRaw,
              column.field.primaryFailed ?? false,
              'bg-layer-3',
              'top',
            ),
          )}

          {/* Secondary run row */}
          <div className={classNames(VALUE_CELL_BASE, LEFT_CELL_STICKY, 'z-20 bg-layer-3 gap-2')}>
            <CompareRunIndexBadge runIndex={RUN_COMPARE_SECONDARY_INDEX} />
            <DialEllipsisTooltip
              text={hasComparedMatch ? comparedRunName : t(RunsI18nKey.RunCompareNoMatch)}
              className="text-primary"
            />
          </div>
          {columns.map((column) =>
            hasComparedMatch ? (
              renderValueCell(
                `secondary-${column.sectionKey}-${column.field.fieldKey}`,
                column.field,
                column.field.secondaryRaw,
                column.field.secondaryFailed ?? false,
                'bg-layer-3',
                'bottom',
              )
            ) : (
              <div
                key={`secondary-${column.sectionKey}-${column.field.fieldKey}`}
                className={mergeClasses(VALUE_CELL_BASE, 'bg-layer-3')}
              >
                <span className="text-secondary dial-small-text">{t(RunsI18nKey.RunCompareNoMatch)}</span>
              </div>
            ),
          )}

          {/* Delta row */}
          {hasComparedMatch && (
            <>
              <div className={classNames(VALUE_CELL_BASE, LEFT_CELL_STICKY, 'z-20 bg-layer-3')}>
                <span className="text-primary dial-small-text">{DEFAULT_COMPARE_DELTA_HEADER}</span>
              </div>
              {columns.map((column) => (
                <div
                  key={`delta-${column.sectionKey}-${column.field.fieldKey}`}
                  className={mergeClasses(VALUE_CELL_BASE, 'bg-layer-3')}
                >
                  {column.hasDelta ? (
                    <CompareMetricDeltaValue
                      primaryRaw={column.field.primaryRaw}
                      secondaryRaw={column.field.secondaryRaw}
                    />
                  ) : null}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      <div className="relative shrink-0 h-4">
        <DiffMiniMap scrollContainerRef={scrollContainerRef} isHorizontal />
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

export default CompareRowDetailPivotTable;
