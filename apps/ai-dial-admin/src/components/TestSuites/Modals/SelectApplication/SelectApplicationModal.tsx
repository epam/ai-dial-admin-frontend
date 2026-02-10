import { FC, useState } from 'react';

import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import AgGridWrapper from '@/src/components/Grid/AgGridWrapper';
import { RADIO_BUTTON_COL_DEF } from '@/src/constants/ag-grid';
import { EVALUATION_DEPLOYMENTS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';

interface Props {
  selected?: string;
  apps?: Deployment[];
  isModalOpen: boolean;
  onClose: () => void;
  onApply: (name?: string) => void;
}

const SelectApplicationModal: FC<Props> = ({ selected, apps, isModalOpen, onClose, onApply }) => {
  const t = useI18n();

  const [selectedApp, setSelectedApp] = useState(selected);

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(CreateI18nKey.Application)}
      portalId="SelectAppModal"
      open={isModalOpen}
      size={PopupSize.Lg}
      className="h-[750px]"
      onSubmit={() => onApply(selectedApp)}
      disableSubmitButton={!selectedApp}
      submitLabel={t(ButtonsI18nKey.Apply)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onCancel={onClose}
    >
      <div className="flex flex-col px-6 py-4 h-full">
        <AgGridWrapper
          columnDefs={EVALUATION_DEPLOYMENTS_COLUMNS(t)}
          additionalGridOptions={{
            rowSelection: { mode: 'singleRow', enableClickSelection: true },
            selectionColumnDef: {
              ...RADIO_BUTTON_COL_DEF,
              cellRenderer: (data: { data?: { deploymentId: string }; deploymentId: string }) => (
                <RadioButtonRenderer
                  inputId={data.data?.deploymentId || data.deploymentId}
                  isChecked={data.data?.deploymentId === selectedApp}
                />
              ),
            },
            onRowSelected: (event) => {
              if (event.node.isSelected()) {
                setSelectedApp(event.data.deploymentId);
              }
            },
            onGridReady: (event) => {
              event.api?.updateGridOptions({
                columnDefs: EVALUATION_DEPLOYMENTS_COLUMNS(t),
                rowData: apps,
              });
              event.api.forEachNode((node) => {
                if (node.data.deploymentId === selectedApp) {
                  node.setSelected(true);
                }
              });
            },
          }}
        />
      </div>
    </DialFormPopup>
  );
};

export default SelectApplicationModal;
