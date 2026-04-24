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
  selectedId?: string;
  emptyTitle: string;
  isLoading?: boolean;
  onSelect: (item: T) => void;
}

// TODO: use for all cases
function RadioSelectGrid<T extends object>({
  data,
  columnDefs,
  idField,
  selectedId,
  emptyTitle,
  isLoading,
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
            isChecked={params.data?.[idField] === selectedId}
          />
        ),
      },
      onRowSelected,
      onFirstDataRendered: (event: FirstDataRenderedEvent) => {
        if (selectedId) {
          event.api.forEachNode((node) => {
            if (node.data?.[idField] === selectedId) {
              node.setSelected(true);
              event.api.ensureNodeVisible(node, 'middle');
            }
          });
        }
      },
    }),
    [selectedId, onRowSelected, idField],
  );

  if (isLoading) {
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
          emptyDataProps={{ title: emptyTitle }}
        />
      </div>
    </div>
  );
}

export default RadioSelectGrid;
