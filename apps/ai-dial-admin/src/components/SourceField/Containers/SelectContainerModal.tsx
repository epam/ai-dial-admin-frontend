import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useState } from 'react';
import { GridOptions } from 'ag-grid-community';

import { SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import { SOURCE_CONTAINERS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';

import AgGridWrapper from '@/src/components/Grid/AgGridWrapper';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';

interface Props {
  selectedId?: string;
  containers?: Container[];
  isModalOpen: boolean;
  onClose: () => void;
  onApply: (id?: string) => void;
}

const SelectContainerModal: FC<Props> = ({ selectedId, containers, isModalOpen, onClose, onApply }) => {
  const t = useI18n();

  const [selectedContainer, setSelectedContainer] = useState(selectedId);

  const options: GridOptions = {
    ...SINGLE_ROW_SELECTION,
    selectionColumnDef: {
      ...SINGLE_ROW_SELECTION.selectionColumnDef,
      cellRenderer: (data: { data?: { name: string; image: string }; name: string }) => (
        <RadioButtonRenderer inputId={data.data?.name || data.name} isChecked={data.data?.name === selectedContainer} />
      ),
    },
    onRowSelected: (event) => {
      if (event.node.isSelected()) {
        setSelectedContainer(event.data.name);
      }
    },
    onGridReady: (event) => {
      event.api?.updateGridOptions({
        columnDefs: SOURCE_CONTAINERS_COLUMNS,
        rowData: containers,
      });
      event.api.forEachNode((node) => {
        if (node.data.name === selectedContainer) {
          node.setSelected(true);
        }
      });
    },
  };

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(CreateI18nKey.SelectContainer)}
      portalId="SelectContainer"
      open={isModalOpen}
      size={PopupSize.Lg}
      className="h-[750px]"
      onSubmit={() => onApply(selectedContainer)}
      disableSubmitButton={!selectedContainer}
      submitLabel={t(ButtonsI18nKey.Apply)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onCancel={onClose}
    >
      <div className="flex flex-col px-6 py-4 h-full">
        <AgGridWrapper columnDefs={SOURCE_CONTAINERS_COLUMNS} additionalGridOptions={options} />
      </div>
    </DialFormPopup>
  );
};

export default SelectContainerModal;
