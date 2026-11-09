'use client';

import { useCallback, useMemo } from 'react';

import { Spinner } from '@epam/ai-dial-ui-kit';
import { ColDef, GridApi, GridOptions, RowSelectedEvent } from 'ag-grid-community';

import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import GridView from '@/src/components/Grid/GridView/GridView';
import { SINGLE_ROW_SELECTION, SINGLE_ROW_SELECTION_NO_CHECKBOX } from '@/src/constants/ag-grid';

interface Props<T extends object> {
  data: T[] | null;
  columnDefs: ColDef[];
  idField: string;
  selectedId?: string;
  emptyTitle: string;
  isLoading?: boolean;
  /** The radio is rendered inside the name column (`RadioNameCellRenderer`), so no separate selection column is added. */
  isRadioInNameColumn?: boolean;
  onSelect: (item: T) => void;
  /** AG Grid custom components (e.g. a string `filter` a column def references) this grid's columns need. */
  components?: GridOptions['components'];
}

// TODO: use for all cases
function RadioSelectGrid<T extends object>({
  data,
  columnDefs,
  idField,
  selectedId,
  emptyTitle,
  isLoading,
  isRadioInNameColumn,
  onSelect,
  components,
}: Props<T>) {
  const onRowSelected = useCallback(
    (event: RowSelectedEvent) => {
      if (isRadioInNameColumn) {
        // RadioNameCellRenderer reads the node's selection state on render, so refresh the row on change.
        event.api.refreshCells({ rowNodes: [event.node], force: true });
      }
      if (event.node.isSelected() && event.data) {
        onSelect(event.data);
      }
    },
    [onSelect, isRadioInNameColumn],
  );

  const selectNodeById = useCallback(
    (api: GridApi) => {
      if (!selectedId) {
        return;
      }
      api.forEachNode((node) => {
        if (node.data?.[idField] === selectedId) {
          node.setSelected(true);
          api.ensureNodeVisible(node, 'middle');
        }
      });
    },
    [selectedId, idField],
  );

  const additionalGridOptions: GridOptions = useMemo(() => {
    const selectionOptions: Partial<GridOptions> = isRadioInNameColumn
      ? {
          ...SINGLE_ROW_SELECTION_NO_CHECKBOX,
          // Replacing rowData drops node selection, so restore it for the new rows.
          onRowDataUpdated: (event) => selectNodeById(event.api),
        }
      : {
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
        };

    return {
      ...selectionOptions,
      components,
      onRowSelected,
      onFirstDataRendered: (event) => selectNodeById(event.api),
    };
  }, [selectedId, onRowSelected, idField, components, isRadioInNameColumn, selectNodeById]);

  if (isLoading) {
    return (
      <div className="size-full flex flex-col">
        <Spinner size={40} fullWidth />
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
