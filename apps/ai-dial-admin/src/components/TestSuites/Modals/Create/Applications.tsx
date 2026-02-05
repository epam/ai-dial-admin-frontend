'use client';

import { Dispatch, FC, MouseEvent, SetStateAction, useCallback, useMemo, useState } from 'react';

import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { IconColumns2 } from '@tabler/icons-react';
import { GridOptions, RowSelectedEvent } from 'ag-grid-community';

import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import GridWithColumnsPanel from '@/src/components/Grid/GridWithColumnsPanel/GridWithColumnsPanel';
import { RADIO_BUTTON_COL_DEF } from '@/src/constants/ag-grid';
import { DEPLOYMENTS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  deployments: Deployment[] | null;
  selectedApplicationId?: string;
  onChangeApplication: (deployment: Deployment) => void;
  onChange: Dispatch<SetStateAction<TestSuite>>;
}

const Applications: FC<Props> = ({ deployments, selectedApplicationId, onChangeApplication, onChange }) => {
  const t = useI18n();

  const [showColumnsPanel, setShowColumnsPanel] = useState(false);

  const data = useMemo(() => {
    return deployments || [];
  }, [deployments]);

  const onRowSelected = (event: RowSelectedEvent) => {
    if (event.node.isSelected()) {
      onChangeApplication(event.data || '');
      onChange((prev: TestSuite) => ({
        ...prev,
        deploymentRef: {
          id: event.data.deploymentId,
          name: event.data.displayName,
          version: event.data.version,
        },
        endpointRef: void 0,
      }));
    }
  };

  const additionalGridOptions: GridOptions = {
    rowSelection: {
      mode: 'singleRow',
      enableClickSelection: true,
    },
    suppressRowClickSelection: true,
    selectionColumnDef: {
      ...RADIO_BUTTON_COL_DEF,
      cellRenderer: (data: { data?: { deploymentId: string }; deploymentId: string }) => (
        <RadioButtonRenderer
          inputId={data.data?.deploymentId || data.deploymentId}
          isChecked={data.data?.deploymentId === selectedApplicationId}
        />
      ),
    },
    onRowSelected: onRowSelected,
  };

  const toggleColumnsPanel = useCallback(() => setShowColumnsPanel(!showColumnsPanel), [showColumnsPanel]);

  const onToggleColumnsPanel = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      toggleColumnsPanel();
    },
    [toggleColumnsPanel],
  );

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex flex-row mb-4 items-center justify-between">
        <h2 className="font-semibold">{t(MenuI18nKey.Applications)}</h2>

        <DialGhostButton
          label={t(ButtonsI18nKey.Columns)}
          iconBefore={<IconColumns2 {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onToggleColumnsPanel}
        />
      </div>

      <div className="flex-1 min-h-0">
        <GridWithColumnsPanel
          columnDefs={DEPLOYMENTS_COLUMNS(t)}
          data={data}
          additionalGridOptions={{ ...additionalGridOptions }}
          emptyDataTitle={t(EntitiesI18nKey.NoApplications)}
          showColumnsPanel={showColumnsPanel}
          toggleColumnsPanel={toggleColumnsPanel}
        />
      </div>
    </div>
  );
};

export default Applications;
