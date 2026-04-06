'use client';

import { useCallback, useMemo } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { ColDef, FirstDataRenderedEvent, GridOptions, RowSelectedEvent } from 'ag-grid-community';

import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import GridView from '@/src/components/Grid/GridView/GridView';
import { SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';

interface Props<T extends object> {
  data: T[] | null;
  columnDefs: ColDef[];
  idField: string;
  initialSelectedId?: string;
  emptyTitle: string;
  errorTitle?: string;
  hasError?: boolean;
  onSelect: (item: T) => void;
}

function RadioSelectGrid<T extends object>({
  data,
  columnDefs,
  idField,
  initialSelectedId,
  emptyTitle,
  errorTitle,
  hasError,
  onSelect,
}: Props<T>) {
  const onRowSelected = useCallback(
    (event: RowSelectedEvent) => {
      if (event.node.isSelected() && event.data) {
        onSelect(event.data);
      }
    },
    [onSelect],
  );

  const additionalGridOptions: GridOptions = useMemo(
    () => ({
      ...SINGLE_ROW_SELECTION,
      selectionColumnDef: {
        ...SINGLE_ROW_SELECTION.selectionColumnDef,
        cellRenderer: (params: { data?: Record<string, string> }) => (
          <RadioButtonRenderer
            inputId={params.data?.[idField] || ''}
            isChecked={params.data?.[idField] === initialSelectedId}
          />
        ),
      },
      onRowSelected,
      onFirstDataRendered: (event: FirstDataRenderedEvent) => {
        if (initialSelectedId) {
          event.api.forEachNode((node) => {
            if (node.data?.[idField] === initialSelectedId) {
              node.setSelected(true);
              event.api.ensureNodeVisible(node, 'middle');
            }
          });
        }
      },
    }),
    [initialSelectedId, onRowSelected, idField],
  );

  if (data == null) {
    return (
      <div className="size-full flex flex-col">
        <DialLoader size={40} />
      </div>
    );
  }

  return (
    <div className="size-full flex flex-col">
      <div className="flex-1 min-h-0">
        <GridView
          columnDefs={columnDefs}
          rowData={data}
          additionalGridOptions={additionalGridOptions}
          emptyDataProps={{ title: hasError && errorTitle ? errorTitle : emptyTitle }}
        />
      </div>
    </div>
  );
}

export default RadioSelectGrid;
