import { FC, useState } from 'react';

import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { GridOptions } from 'ag-grid-community';

import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import { SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import { EVALUATION_DEPLOYMENTS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, CreateI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';
import GridView from '@/src/components/Grid/GridView/GridView';

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

  const options: GridOptions = {
    ...SINGLE_ROW_SELECTION,
    selectionColumnDef: {
      ...SINGLE_ROW_SELECTION.selectionColumnDef,
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
      event.api.forEachNode((node) => {
        if (node.data.deploymentId === selectedApp) {
          node.setSelected(true);
        }
      });
    },
  };

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
        <GridView
          emptyDataProps={{ title: t(EntitiesI18nKey.NoApplications) }}
          rowData={apps}
          columnDefs={EVALUATION_DEPLOYMENTS_COLUMNS(t)}
          additionalGridOptions={options}
        />
      </div>
    </DialFormPopup>
  );
};

export default SelectApplicationModal;
