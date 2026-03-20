import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useState } from 'react';
import { GridOptions, GridReadyEvent } from 'ag-grid-community';

import GridView from '@/src/components/Grid/GridView/GridView';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import { SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import { LIST_RUNNER_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplicationScheme } from '@/src/models/dial/application';

interface Props {
  selectedId?: string;
  sourceEntities?: DialApplicationScheme[];
  isModalOpen: boolean;
  onClose: () => void;
  onApply: (id?: string) => void;
}

const SelectAppRunnerModal: FC<Props> = ({ selectedId, sourceEntities, isModalOpen, onClose, onApply }) => {
  const t = useI18n();

  const [selectedRunner, setSelectedRunner] = useState(selectedId);

  const isSelectedNode = (data?: DialApplicationScheme | DialAdapter) => {
    const runner = data as DialApplicationScheme;
    const adapter = data as DialAdapter;
    return runner?.$id === selectedRunner || adapter?.name === selectedRunner;
  };

  const options: GridOptions = {
    ...SINGLE_ROW_SELECTION,
    selectionColumnDef: {
      ...SINGLE_ROW_SELECTION.selectionColumnDef,
      cellRenderer: (data: { data?: DialApplicationScheme | DialAdapter; id: string }) => {
        const runner = data.data as DialApplicationScheme;
        const adapter = data.data as DialAdapter;
        const isActive = isSelectedNode(data.data);

        return <RadioButtonRenderer inputId={runner?.$id || adapter?.name || data.id} isChecked={isActive} />;
      },
    },
    onRowSelected: (event) => {
      if (event.node.isSelected()) {
        setSelectedRunner(event.data.$id || event.data.name);
      }
    },
  };

  const onGridReady = (event: GridReadyEvent) => {
    event.api?.updateGridOptions({
      rowData: [...(sourceEntities || [])],
    });
    event.api.forEachNode((node) => {
      if (isSelectedNode(node.data)) {
        node.setSelected(true);
      }
    });
  };

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(EntitiesI18nKey.AppRunner)}
      portalId="SelectAppRunnerModal"
      open={isModalOpen}
      size={PopupSize.Lg}
      className="h-[750px]"
      onSubmit={() => onApply(selectedRunner)}
      disableSubmitButton={!selectedRunner}
      submitLabel={t(ButtonsI18nKey.Apply)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onCancel={onClose}
    >
      <div className="flex flex-col px-6 py-4 h-full">
        <GridView
          columnDefs={LIST_RUNNER_COLUMNS.map((col) => ({ ...col, sort: void 0 }))}
          additionalGridOptions={options}
          onGridReady={onGridReady}
        />
      </div>
    </DialFormPopup>
  );
};

export default SelectAppRunnerModal;
