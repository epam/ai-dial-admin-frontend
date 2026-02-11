'use client';

import { DialCheckbox, DialGhostButton } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';
import { FC, useCallback, useRef } from 'react';
import { useDrop } from 'react-dnd';

import DraggableItem from '@/src/components/Common/DraggableItem/DraggableItem';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import CloseButton from '@/src/components/Common/CloseButton/CloseButton';
import { useI18n } from '@/src/locales/client';
import { COLUMN_PANEL_PREFIX } from '@/src/constants/grid-columns/grid-columns';

interface Props {
  columns: ColDef[];
  showResetButton: boolean;
  panelClassName: string;
  onReset: () => void;
  toggleColumnsPanel?: () => void;
  toggleColumnVisibility: (id?: string) => void;
  onFind?: (field: string) => number;
  onMove?: (field: string, atIndex: number) => void;
}

const ColumnsPanel: FC<Props> = ({
  columns,
  showResetButton,
  panelClassName,
  onReset,
  toggleColumnsPanel,
  toggleColumnVisibility,
  onFind,
  onMove,
}) => {
  const t = useI18n();
  const ref = useRef<HTMLDivElement | null>(null);

  const onCheckedChange = useCallback(
    (_value?: boolean, id?: string) => toggleColumnVisibility?.(id?.replace(COLUMN_PANEL_PREFIX, '')),
    [toggleColumnVisibility],
  );

  const [, drop] = useDrop(() => ({ accept: 'column' }));

  drop(ref);

  return (
    <div
      className={panelClassName}
      onClick={(e) => e.stopPropagation()}
      role="toolbar"
      aria-label={t(ButtonsI18nKey.Columns)}
    >
      <div className="flex flex-row justify-between py-4 px-6 items-center h-[70px]">
        <h3 className="flex-1 min-w-0 mr-3">{t(ButtonsI18nKey.Columns)}</h3>
        <div className="flex">
          {showResetButton && (
            <DialGhostButton className="mr-4" label={t(ButtonsI18nKey.ResetToDefault)} onClick={onReset} />
          )}
          {toggleColumnsPanel && <CloseButton onClose={toggleColumnsPanel} />}
        </div>
      </div>
      <div ref={ref} className="flex-1 flex flex-col p-6 overflow-y-auto">
        <ul className="flex flex-col gap-4">
          {columns
            .filter((col) => !col.suppressColumnsToolPanel && col.field && col.headerName)
            .map((col) => {
              return (
                <li key={col.field}>
                  <DraggableItem id={col.field || ''} findItem={onFind} moveItem={onMove}>
                    <DialCheckbox
                      label={col.headerName}
                      id={`${COLUMN_PANEL_PREFIX}${col.field}`}
                      checked={!col.hide}
                      onChange={onCheckedChange}
                    />
                  </DraggableItem>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
};

export default ColumnsPanel;
