'use client';

import { FC, Fragment, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import classNames from 'classnames';
import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';

import DiffMiniMap from '@/src/components/Common/DiffMiniMap/DiffMiniMap';
import { DEFAULT_COMPARE_DELTA_HEADER } from '@/src/components/Runs/Compare/ExecutionResults/constants';
import CompareMetricDeltaValue from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareMetricDeltaValue';
import PivotValueCell from '@/src/components/Runs/View/RowDetails/PivotValueCell';
import {
  getPivotGridMinWidth,
  getPivotGridTemplateColumns,
} from '@/src/components/Runs/Details/RowDetails/utils/pivot-column-width';
import { filterRowDetailSections } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/filter-row-detail-sections';
import { RowDetailField, RowDetailSection } from '@/src/components/Runs/Details/RowDetails/models';
import { isRightAlignedRowDetailField } from '@/src/components/Runs/Details/RowDetails/utils/row-detail-alignment';
import { flattenPivotFields } from '@/src/components/Runs/Details/RowDetails/utils/flatten-pivot-fields';
import { ROW_DETAIL_PIVOT_LEFT_COL_WIDTH } from '@/src/components/Runs/Details/RowDetails/constants';
import { scrollPivotToField } from '@/src/components/Runs/Details/RowDetails/utils/scroll-pivot-to-field';
import {
  CompareDiffPivotPosition,
  getCompareDiffPivotCellProps,
  getCompareDiffPivotPosition,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/row-detail-styles';
import CompareRunIndexBadge from '@/src/components/Runs/Compare/CompareRunIndexBadge';
import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';
import { CompareRun } from '@/src/components/Runs/Compare/models';
import { getRowDetailRunValue } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/run-field-values';
import { SECTION_I18N } from '@/src/components/Runs/Details/BottomDrawer/constants';
import FullscreenDiffViewer from '@/src/components/Runs/Details/BottomDrawer/FullscreenDiffViewer';
import { DiffViewState } from '@/src/components/Runs/Details/BottomDrawer/models';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { mergeClasses } from '@/src/utils/merge-classes';

interface Props {
  sections: RowDetailSection[];
  runs: CompareRun[];
  hasComparedMatch: boolean;
  showDiffsOnly: boolean;
  hideHighlights: boolean;
  focusFieldKey?: string | null;
  focusRequestId?: number;
}

const HEADER_CELL_BASE = 'h-10 px-3 flex items-center bg-layer-1 border-b border-secondary dial-small-semi-text';
const LEFT_CELL_STICKY = 'sticky left-0';
const VALUE_CELL_BASE =
  'p-3 border-b border-r border-tertiary min-w-0 overflow-hidden h-full min-h-10 flex items-start self-stretch';

const CompareRowDetailPivotTable: FC<Props> = ({
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
  const [diffView, setDiffView] = useState<DiffViewState | null>(null);

  const onOpenDiff = useCallback(
    (field: RowDetailField) => {
      const [original, modified] = [runs[0], runs[runs.length - 1]].map(
        (run) => getRowDetailRunValue(field, run.slot).raw ?? '',
      );
      setDiffView({ fieldLabel: field.label, original, modified });
    },
    [runs],
  );

  const onCloseDiff = useCallback(() => setDiffView(null), []);

  const filteredSections = useMemo(
    () => filterRowDetailSections(sections, { searchQuery: '', showDiffsOnly }),
    [sections, showDiffsOnly],
  );

  const columns = useMemo(() => flattenPivotFields(filteredSections), [filteredSections]);

  const gridTemplateColumns = useMemo(() => getPivotGridTemplateColumns(columns), [columns]);
  const gridMinWidth = useMemo(() => getPivotGridMinWidth(columns), [columns]);
  // minmax(0, 1fr), not bare 1fr, on the run value rows: a bare fr track can't
  // shrink below its content's min-content height, so a long cell value would blow out the row
  // instead of scrolling inside PivotValueCell.
  const gridTemplateRows = [
    'auto',
    'auto',
    ...runs.map(() => 'minmax(0, 1fr)'),
    ...(hasComparedMatch ? ['auto'] : []),
  ].join(' ');
  const getRunLabel = (run: CompareRun) =>
    run.slot === CompareRunSlot.Secondary && !hasComparedMatch ? t(RunsI18nKey.RunCompareNoMatch) : run.name;

  useLayoutEffect(() => {
    scrollPivotToField(scrollContainerRef.current, focusFieldKey);
  }, [focusFieldKey, focusRequestId, columns]);

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
        className={mergeClasses(rowBg, props.className)}
        data-compare-diff={props['data-compare-diff']}
        onOpenFullscreen={() => onOpenDiff(field)}
      />
    );
  };

  const renderRunRow = (run: CompareRun, position: CompareDiffPivotPosition) => {
    const isMissing = run.slot === CompareRunSlot.Secondary && !hasComparedMatch;

    return (
      <Fragment key={run.slot}>
        <div className={classNames(VALUE_CELL_BASE, LEFT_CELL_STICKY, 'z-20 bg-layer-3 gap-2')}>
          <CompareRunIndexBadge runIndex={run.index} />
          <EllipsisTooltip text={getRunLabel(run)} className="text-primary" />
        </div>
        {columns.map((column) => {
          const key = `${run.slot}-${column.sectionKey}-${column.field.fieldKey}`;
          if (isMissing) {
            return (
              <div key={key} className={mergeClasses(VALUE_CELL_BASE, 'bg-layer-3')}>
                <span className="text-secondary dial-small-text">{t(RunsI18nKey.RunCompareNoMatch)}</span>
              </div>
            );
          }

          const { raw, isFailed } = getRowDetailRunValue(column.field, run.slot);
          return renderValueCell(key, column.field, raw, isFailed, 'bg-layer-3', position);
        })}
      </Fragment>
    );
  };

  return (
    <div className="relative flex flex-col flex-1 min-h-0 rounded overflow-hidden gap-2">
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollPaddingLeft: ROW_DETAIL_PIVOT_LEFT_COL_WIDTH }}
      >
        <div
          className="dial-tiny-text grid w-full h-full"
          style={{ gridTemplateColumns, gridTemplateRows, minWidth: gridMinWidth }}
        >
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
                {column.isSectionStart ? <EllipsisTooltip text={sectionLabel} className="text-secondary" /> : null}
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
              <EllipsisTooltip
                text={column.field.label}
                className={classNames('text-secondary', isRightAlignedRowDetailField(column.field) && 'text-right')}
              />
            </div>
          ))}

          {runs.map((run, index) => renderRunRow(run, getCompareDiffPivotPosition(index, runs.length)))}

          {/* Delta row */}
          {hasComparedMatch && (
            <>
              <div className={classNames(VALUE_CELL_BASE, LEFT_CELL_STICKY, 'z-20 bg-layer-3')}>
                <span className="text-primary dial-small-text">{DEFAULT_COMPARE_DELTA_HEADER}</span>
              </div>
              {columns.map((column) => (
                <div
                  key={`delta-${column.sectionKey}-${column.field.fieldKey}`}
                  className={mergeClasses(VALUE_CELL_BASE, 'bg-layer-3', column.hasDelta && 'justify-end')}
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
          originalLabel={getRunLabel(runs[0])}
          modifiedLabel={getRunLabel(runs[runs.length - 1])}
          onClose={onCloseDiff}
        />
      )}
    </div>
  );
};

export default CompareRowDetailPivotTable;
