'use client';
import { ColDef } from 'ag-grid-community';
import { FC, useCallback, useRef } from 'react';
import classNames from 'classnames';
import { IconX } from '@tabler/icons-react';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import Checkbox from '@/src/components/Common/Checkbox/Checkbox';
import Button from '@/src/components/Common/Button/Button';
import DraggableItem from '@/src/components/Common/DraggableItem/DraggableItem';
import { useDrop } from 'react-dnd';

interface Props {
  columns: ColDef[];
  showResetButton: boolean;
  panelClassNames: string;
  resetToDefault: () => void;
  toggleColumnsPanel?: () => void;
  toggleColumnVisibility: (id?: string) => void;
  findColumn?: (field: string) => number;
  moveColumn?: (field: string, atIndex: number) => void;
}

const ColumnsPanel: FC<Props> = ({
  columns,
  showResetButton,
  panelClassNames,
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

  const headerClassNames = classNames('flex flex-row justify-between py-4 px-6 items-center h-[70px]');
  const bodyClassNames = classNames('flex-1 flex flex-col p-6');

  const [, drop] = useDrop(() => ({ accept: 'column' }));

  drop(ref);

  return (
    <div className={panelClassNames} onClick={(e) => e.stopPropagation()}>
      <div className={headerClassNames}>
        <h3 className="flex-1 min-w-0 mr-3">{t(ButtonsI18nKey.Columns)}</h3>
        <div className="flex">
          {showResetButton && (
            <Button cssClass="tertiary mr-4" title={t(ButtonsI18nKey.ResetToDefault)} onClick={resetToDefault} />
          )}
          <button
            type="button"
            className="text-secondary hover:text-accent-primary"
            aria-label="button"
            onClick={toggleColumnsPanel}
          >
            <IconX height={24} width={24} />
          </button>
        </div>
      </div>
      <div ref={ref} className={bodyClassNames}>
        <ul className="flex flex-col gap-4">
          {columns
            .filter((col) => !col.suppressColumnsToolPanel)
            .map((col) => {
              return (
                <li key={col.field}>
                  <DraggableItem id={col.field || ''} findItem={findColumn} moveItem={moveColumn}>
                    <Checkbox
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
