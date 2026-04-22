'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { DialLoader, DialTabs } from '@epam/ai-dial-ui-kit';

import { getDeployments } from '@/src/app/[lang]/test-suites/actions';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import GridView from '@/src/components/Grid/GridView/GridView';
import { SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import { TEMP_FOLDER } from '@/src/constants/file';
import { EVALUATION_DEPLOYMENTS_COLUMNS, MCP_DEPLOYMENTS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Deployment, DeploymentType } from '@/src/models/evaluation/deployment';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import { FirstDataRenderedEvent, GridOptions, RowSelectedEvent } from 'ag-grid-community';
import { TargetTab } from './types';
import { buildDeploymentUpdate, getInitialTab } from './utils';

interface Props {
  selectedTargetId?: string;
  suiteType?: SuiteType;
  onChangeTarget: (deployment: Deployment) => void;
  onChange: Dispatch<SetStateAction<TestSuite>>;
}

const Target: FC<Props> = ({ selectedTargetId, suiteType, onChangeTarget, onChange }) => {
  const t = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(getInitialTab(suiteType));
  const [deployments, setDeployments] = useState<Deployment[] | null>(null);

  const tabs = useMemo(
    () => [
      { id: TargetTab.Applications, label: t(MenuI18nKey.Applications) },
      { id: TargetTab.Models, label: t(MenuI18nKey.Models) },
      { id: TargetTab.Mcp, label: t(EntitiesI18nKey.MCP) },
    ],
    [t],
  );

  const onRowSelected = useCallback(
    (event: RowSelectedEvent) => {
      if (event.node.isSelected() && event.data) {
        onChangeTarget(event.data);
        onChange((prev: TestSuite) => ({ ...prev, ...buildDeploymentUpdate(event.data) }));
      }
    },
    [onChangeTarget, onChange],
  );

  const additionalGridOptions: GridOptions = useMemo(
    () => ({
      ...SINGLE_ROW_SELECTION,
      selectionColumnDef: {
        ...SINGLE_ROW_SELECTION.selectionColumnDef,
        cellRenderer: (params: { data?: Record<string, string> }) => (
          <RadioButtonRenderer
            inputId={params.data?.deploymentId || ''}
            isChecked={params.data?.deploymentId === selectedTargetId}
          />
        ),
      },
      onRowSelected,
      onFirstDataRendered: (event: FirstDataRenderedEvent) => {
        if (selectedTargetId) {
          event.api.forEachNode((node) => {
            if (node.data?.deploymentId === selectedTargetId) {
              node.setSelected(true);
              event.api.ensureNodeVisible(node, 'middle');
            }
          });
        }
      },
    }),
    [onRowSelected, selectedTargetId],
  );

  useEffect(() => {
    const type =
      activeTab === TargetTab.Applications
        ? DeploymentType.Application
        : activeTab === TargetTab.Models
          ? DeploymentType.Model
          : void 0;
    setIsLoading(true);

    getDeployments(type, activeTab === TargetTab.Mcp ? 'mcp' : void 0).then((res) => {
      if (res?.success) {
        setDeployments(res.response?.filter((res) => res.displayName !== TEMP_FOLDER) || []);
      }
      setIsLoading(false);
    });
  }, [activeTab]);

  return (
    <div className="size-full flex flex-col">
      <div className="flex flex-row mb-4 items-center justify-between">
        <div className="flex-1 min-w-0">
          <DialTabs tabs={tabs} activeTab={activeTab} onClick={setActiveTab} />
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="size-full flex flex-col">
            <DialLoader size={40} />
          </div>
        ) : (
          <div className="size-full flex flex-col">
            <div className="flex-1 min-h-0">
              <GridView
                columnDefs={activeTab === TargetTab.Mcp ? MCP_DEPLOYMENTS_COLUMNS : EVALUATION_DEPLOYMENTS_COLUMNS}
                rowData={deployments}
                additionalGridOptions={additionalGridOptions}
                emptyDataProps={{ title: t(EntitiesI18nKey.NoApplications) }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Target;
