'use client';

import { ButtonVariant, DialButton, DialCheckbox } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';
import classNames from 'classnames';
import { FC, useCallback, useRef } from 'react';
import { useDrop } from 'react-dnd';

import DraggableItem from '@/src/components/Common/DraggableItem/DraggableItem';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import CloseButton from '@/src/components/Common/CloseButton/CloseButton';
import { useI18n } from '@/src/locales/client';

interface Props {
  columns: ColDef[];
  showResetButton: boolean;
  panelClassName: string;
  resetToDefault: () => void;
  toggleColumnsPanel?: () => void;
  toggleColumnVisibility: (id?: string) => void;
  findColumn?: (field: string) => number;
  moveColumn?: (field: string, atIndex: number) => void;
}

const ColumnsPanel: FC<Props> = ({
  columns,
  showResetButton,
  panelClassName,
  resetToDefault,
  toggleColumnsPanel,
  toggleColumnVisibility,
  findColumn,
  moveColumn,
}) => {
  const t = useI18n();
  const ref = useRef<HTMLDivElement | null>(null);

  const onCheckedChange = useCallback(
    (_value?: boolean, id?: string) => toggleColumnVisibility?.(id),
    [toggleColumnVisibility],
  );

  const headerClassName = classNames('flex flex-row justify-between py-4 px-6 items-center h-[70px]');
  const bodyClassName = classNames('flex-1 flex flex-col p-6 overflow-y-auto');

  const [, drop] = useDrop(() => ({ accept: 'column' }));

  drop(ref);

  return (
    <div
      className={panelClassName}
      onClick={(e) => e.stopPropagation()}
      role={'toolbar'}
      aria-label={t(ButtonsI18nKey.Columns)}
    >
      <div className={headerClassName}>
        <h3 className="flex-1 min-w-0 mr-3">{t(ButtonsI18nKey.Columns)}</h3>
        <div className="flex">
          {showResetButton && (
            <DialButton
              variant={ButtonVariant.Tertiary}
              className="mr-4"
              label={t(ButtonsI18nKey.ResetToDefault)}
              onClick={resetToDefault}
            />
          )}
          {toggleColumnsPanel && <CloseButton onClose={toggleColumnsPanel} />}
        </div>
      </div>
      <div ref={ref} className={bodyClassName}>
        <ul className="flex flex-col gap-4">
          {columns
            .filter((col) => !col.suppressColumnsToolPanel)
            .map((col) => {
              return (
                <li key={col.field}>
                  <DraggableItem id={col.field || ''} findItem={findColumn} moveItem={moveColumn}>
                    <DialCheckbox
                      label={col.headerName}
                      id={col.field || ''}
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
