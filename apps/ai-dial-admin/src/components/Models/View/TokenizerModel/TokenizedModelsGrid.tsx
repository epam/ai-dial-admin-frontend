'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getModelsTokenizers } from '@/src/app/[lang]/models/actions';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import AgGridWrapper from '@/src/components/Grid/AgGridWrapper';
import { RADIO_BUTTON_COL_DEF, SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import { BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { useNotification } from '@/src/context/NotificationContext';
import { DialTokenizer } from '@/src/models/dial/model';
import { getErrorNotification } from '@/src/utils/notification';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { GridOptions } from 'ag-grid-community';

interface Props {
  selectedModel?: string;
  onSelectModelId: (id: string) => void;
}

const TokenizedModelsGrid: FC<Props> = ({ onSelectModelId, selectedModel }) => {
  const [data, setData] = useState<DialTokenizer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getReqRef = useRef(useProtectedRequest());
  const showNotificationRef = useRef(useNotification().showNotification);

  useEffect(() => {
    setIsLoading(true);

    getReqRef.current(getModelsTokenizers).then((res) => {
      if (res.success) {
        setData(res.response || []);
        setIsLoading(false);
      } else {
        showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        setIsLoading(false);
      }
    });
  }, [setData]);

  const options: GridOptions = {
    ...SINGLE_ROW_SELECTION,
    selectionColumnDef: {
      ...SINGLE_ROW_SELECTION.selectionColumnDef,
      cellRenderer: (data: { data?: DialTokenizer; id: string }) => (
        <RadioButtonRenderer inputId={data.data?.id || data.id} isChecked={data.data?.id === selectedModel} />
      ),
    },
    onCellClicked: (event) => {
      onSelectModelId(event.data.id);
      const selectedRows = event.api.getSelectedRows();
      event.api.setNodesSelected({ nodes: selectedRows, newValue: false });
      event.api.setNodesSelected({ nodes: [event.node], newValue: true });
    },
    onGridReady: (event) => {
      event.api?.updateGridOptions({
        columnDefs: BASE_COLUMNS,
        rowData: data,
      });
      event.api.forEachNode((node) => {
        if (node.data.name === selectedModel) {
          node.setSelected(true);
        }
      });
    },
  };

  return isLoading ? (
    <DialLoader size={40} />
  ) : (
    <AgGridWrapper columnDefs={BASE_COLUMNS} rowData={data} additionalGridOptions={options} />
  );
};

export default TokenizedModelsGrid;
