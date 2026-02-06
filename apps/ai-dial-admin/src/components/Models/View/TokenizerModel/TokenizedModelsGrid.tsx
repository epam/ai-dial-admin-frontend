'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getModelsTokenizers } from '@/src/app/[lang]/models/actions';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import Grid from '@/src/components/Grid/Grid';
import { RADIO_BUTTON_COL_DEF } from '@/src/constants/ag-grid';
import { BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { useNotification } from '@/src/context/NotificationContext';
import { DialTokenizer } from '@/src/models/dial/model';
import { getErrorNotification } from '@/src/utils/notification';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';

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

  return isLoading ? (
    <DialLoader size={40} />
  ) : (
    <Grid
      columnDefs={BASE_COLUMNS}
      rowData={data}
      additionalGridOptions={{
        rowSelection: { mode: 'singleRow' },
        onCellClicked: (event) => {
          onSelectModelId(event.data.id);
          const selectedRows = event.api.getSelectedRows();
          event.api.setNodesSelected({ nodes: selectedRows, newValue: false });
          event.api.setNodesSelected({ nodes: [event.node], newValue: true });
        },
        selectionColumnDef: {
          ...RADIO_BUTTON_COL_DEF,
          cellRenderer: (data: { data?: DialTokenizer; id: string }) => (
            <RadioButtonRenderer inputId={data.data?.id || data.id} isChecked={data.data?.id === selectedModel} />
          ),
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
      }}
    />
  );
};

export default TokenizedModelsGrid;
