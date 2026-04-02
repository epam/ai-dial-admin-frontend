'use client';

import { Dispatch, FC, MouseEvent, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { DialGhostButton, DialLoader, DialTabs } from '@epam/ai-dial-ui-kit';
import { IconColumns2 } from '@tabler/icons-react';
import { FirstDataRenderedEvent, GridOptions, RowSelectedEvent } from 'ag-grid-community';

import { getDeployments } from '@/src/app/[lang]/test-suites/actions';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import GridView from '@/src/components/Grid/GridView/GridView';
import McpTargets from '@/src/components/TestSuites/Modals/Create/McpTargets';
import { SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import { EVALUATION_DEPLOYMENTS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, EntitiesI18nKey, MenuI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';

enum TargetTab {
  Applications = 'applications',
  Models = 'models',
  Mcp = 'mcp',
}

function getInitialTab(suiteType?: SuiteType): TargetTab {
  if (suiteType === 'MCP_TOOL') return TargetTab.Mcp;
  return TargetTab.Applications;
}

interface Props {
  selectedApplicationId?: string;
  suiteType?: SuiteType;
  onChangeApplication: (deployment: Deployment) => void;
  onChange: Dispatch<SetStateAction<TestSuite>>;
}

const Target: FC<Props> = ({ selectedApplicationId, suiteType, onChangeApplication, onChange }) => {
  const t = useI18n();
  const [activeTab, setActiveTab] = useState<string>(getInitialTab(suiteType));
  const [showColumnsPanel, setShowColumnsPanel] = useState(false);
  const [applications, setApplications] = useState<Deployment[] | null>(null);
  const [models, setModels] = useState<Deployment[] | null>(null);

  const tabs = useMemo(
    () => [
      { id: TargetTab.Applications, label: t(MenuI18nKey.Applications) },
      { id: TargetTab.Models, label: t(MenuI18nKey.Models) },
      { id: TargetTab.Mcp, label: t(TestSuitesI18nKey.Mcp) },
    ],
    [t],
  );

  useEffect(() => {
    if (activeTab === TargetTab.Applications && applications == null) {
      getDeployments('dial-application').then((res) => {
        if (res?.success) {
          setApplications(res.response || []);
        }
      });
    }
    if (activeTab === TargetTab.Models && models == null) {
      getDeployments('dial-model').then((res) => {
        if (res?.success) {
          setModels(res.response || []);
        }
      });
    }
  }, [activeTab, applications, models]);

  const deployments = activeTab === TargetTab.Models ? models : applications;
  const data = useMemo(() => deployments || [], [deployments]);

  const onRowSelected = (event: RowSelectedEvent) => {
    if (event.node.isSelected()) {
      onChangeApplication(event.data || '');
      onChange((prev: TestSuite) => ({
        ...prev,
        suiteType: 'DEPLOYMENT',
        deploymentRef: {
          id: event.data.deploymentId,
          name: event.data.displayName,
          version: event.data.version,
        },
        endpointRef: void 0,
        mcpDeploymentRef: void 0,
        toolRef: void 0,
        argumentTemplate: void 0,
      }));
    }
  };

  const onMcpSelect = useCallback(
    (deployment: Deployment) => {
      onChangeApplication(deployment);
      onChange((prev: TestSuite) => ({
        ...prev,
        suiteType: 'MCP_TOOL',
        mcpDeploymentRef: {
          id: deployment.deploymentId,
          type: deployment.$type,
          name: deployment.displayName || deployment.deploymentId,
        },
        deploymentRef: void 0,
        endpointRef: void 0,
        requestTemplate: void 0,
        toolRef: void 0,
      }));
    },
    [onChangeApplication, onChange],
  );

  const additionalGridOptions: GridOptions = {
    ...SINGLE_ROW_SELECTION,
    selectionColumnDef: {
      ...SINGLE_ROW_SELECTION.selectionColumnDef,
      cellRenderer: (data: { data?: { deploymentId: string }; deploymentId: string }) => (
        <RadioButtonRenderer
          inputId={data.data?.deploymentId || data.deploymentId}
          isChecked={data.data?.deploymentId === selectedApplicationId}
        />
      ),
    },
    onRowSelected,
    onFirstDataRendered: (event: FirstDataRenderedEvent) => {
      if (selectedApplicationId) {
        event.api.forEachNode((node) => {
          if (node.data?.deploymentId === selectedApplicationId) {
            node.setSelected(true);
            event.api.ensureNodeVisible(node, 'middle');
          }
        });
      }
    },
  };

  const toggleColumnsPanel = useCallback(() => setShowColumnsPanel(!showColumnsPanel), [showColumnsPanel]);

  const onToggleColumnsPanel = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      toggleColumnsPanel();
    },
    [toggleColumnsPanel],
  );

  const isDeploymentTab = activeTab === TargetTab.Applications || activeTab === TargetTab.Models;

  if (deployments == null && isDeploymentTab) {
    return (
      <div className="size-full flex flex-col">
        <DialLoader size={40} />
      </div>
    );
  }

  return (
    <div className="size-full flex flex-col">
      <div className="flex flex-row mb-4 items-center justify-between">
        <div className="flex-1 min-w-0">
          <DialTabs tabs={tabs} activeTab={activeTab} onClick={setActiveTab} />
        </div>

        {isDeploymentTab && (
          <DialGhostButton
            label={t(ButtonsI18nKey.Columns)}
            iconBefore={<IconColumns2 {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onToggleColumnsPanel}
          />
        )}
      </div>

      <div className="flex-1 min-h-0">
        {isDeploymentTab && (
          <GridView
            columnDefs={EVALUATION_DEPLOYMENTS_COLUMNS(t)}
            rowData={data}
            additionalGridOptions={additionalGridOptions}
            emptyDataProps={{ title: t(EntitiesI18nKey.NoApplications) }}
            showColumnsPanel={showColumnsPanel}
            toggleColumnsPanel={toggleColumnsPanel}
          />
        )}

        {activeTab === TargetTab.Mcp && (
          <McpTargets initialDeploymentId={selectedApplicationId} onSelect={onMcpSelect} />
        )}
      </div>
    </div>
  );
};

export default Target;
