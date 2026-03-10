import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useState } from 'react';

import { SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import { BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, CreateI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { InterceptorTemplate } from '@/src/models/interceptor-template';

import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import { GridOptions, GridReadyEvent } from 'ag-grid-community';
import GridView from '@/src/components/Grid/GridView/GridView';

interface Props {
  selected?: string;
  runners?: InterceptorTemplate[];
  isModalOpen: boolean;
  onClose: () => void;
  onApply: (name?: string) => void;
}

const SelectRunnerModal: FC<Props> = ({ selected, runners, isModalOpen, onClose, onApply }) => {
  const t = useI18n();

  const [selectedRunner, setSelectedRunner] = useState(selected);

  const options: GridOptions = {
    ...SINGLE_ROW_SELECTION,
    selectionColumnDef: {
      ...SINGLE_ROW_SELECTION.selectionColumnDef,
      cellRenderer: (data: { data?: { name: string }; name: string }) => (
        <RadioButtonRenderer inputId={data.data?.name || data.name} isChecked={data.data?.name === selectedRunner} />
      ),
    },
    onRowSelected: (event) => {
      if (event.node.isSelected()) {
        setSelectedRunner(event.data.name);
      }
    },
  };

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      event.api?.updateGridOptions({
        columnDefs: BASE_COLUMNS,
        rowData: runners,
      });
      event.api.forEachNode((node) => {
        if (node.data.name === selectedRunner) {
          node.setSelected(true);
        }
      });
    },
    [runners, selectedRunner],
  );
  return (
    <DialFormPopup
      onClose={onClose}
      header={t(CreateI18nKey.SelectInterceptorTemplate)}
      portalId="SelectRunnerModal"
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
          emptyDataProps={{ title: t(EntitiesI18nKey.NoTemplates) }}
          additionalGridOptions={options}
          onGridReady={onGridReady}
        />
      </div>
    </DialFormPopup>
  );
};

export default SelectRunnerModal;
