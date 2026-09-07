'use client';

import { FC, useEffect, useMemo, useRef } from 'react';

import classNames from 'classnames';
import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import { getPivotGridTemplateColumns } from '@/src/components/Runs/Details/RowDetails/utils/pivot-column-width';
import { RowDetailSection } from '@/src/components/Runs/Details/RowDetails/models';
import { flattenPivotFields } from '@/src/components/Runs/Details/RowDetails/utils/flatten-pivot-fields';
import { SECTION_I18N } from '@/src/components/Runs/Details/BottomDrawer/constants';
import PivotValueCell from '@/src/components/Runs/View/RowDetails/PivotValueCell';
import { scrollPivotToField } from '@/src/components/Runs/Details/RowDetails/utils/scroll-pivot-to-field';
import { useI18n } from '@/src/locales/client';

interface Props {
  sections: RowDetailSection[];
  focusFieldKey?: string | null;
}

const HEADER_CELL_BASE = 'h-10 px-3 flex items-center bg-layer-1 border-b border-secondary dial-small-semi-text';

const ExecutionRowDetailPivotTable: FC<Props> = ({ sections, focusFieldKey }) => {
  const t = useI18n();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(() => flattenPivotFields(sections), [sections]);

  const gridTemplateColumns = useMemo(
    () => getPivotGridTemplateColumns(columns, { includeStickyLabelColumn: false }),
    [columns],
  );

  useEffect(() => {
    scrollPivotToField(scrollContainerRef.current, focusFieldKey);
  }, [focusFieldKey, columns]);

  if (columns.length === 0) {
    return null;
  }

  return (
    <div className="relative flex flex-col flex-1 min-h-0 rounded overflow-hidden">
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-auto">
        <div
          className="dial-tiny-text grid w-max min-w-full h-full"
          style={{
            gridTemplateColumns,
            gridTemplateRows: 'auto auto 1fr',
          }}
        >
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

          {columns.map((column) => (
            <div
              key={`field-${column.sectionKey}-${column.field.fieldKey}`}
              className={classNames(HEADER_CELL_BASE, 'text-secondary border-r')}
            >
              <DialEllipsisTooltip text={column.field.label} className="text-secondary" />
            </div>
          ))}

          {columns.map((column) => (
            <PivotValueCell key={`value-${column.sectionKey}-${column.field.fieldKey}`} field={column.field} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutionRowDetailPivotTable;
