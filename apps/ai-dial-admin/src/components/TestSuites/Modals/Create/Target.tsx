'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { DialTabs } from '@epam/ai-dial-ui-kit';

import { getDeployments } from '@/src/app/[lang]/test-suites/actions';
import McpTargets from '@/src/components/TestSuites/Modals/Create/McpTargets';
import RadioSelectGrid from '@/src/components/TestSuites/Modals/Create/RadioSelectGrid';
import { EVALUATION_DEPLOYMENTS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Deployment, DeploymentType } from '@/src/models/evaluation/deployment';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import { TargetTab } from './types';
import { buildDeploymentUpdate, buildMcpDeploymentUpdate, getInitialTab } from './utils';

interface Props {
  selectedApplicationId?: string;
  suiteType?: SuiteType;
  onChangeApplication: (deployment: Deployment) => void;
  onChange: Dispatch<SetStateAction<TestSuite>>;
}

const Target: FC<Props> = ({ selectedApplicationId, suiteType, onChangeApplication, onChange }) => {
  const t = useI18n();
  const [activeTab, setActiveTab] = useState<string>(getInitialTab(suiteType));
  const [applications, setApplications] = useState<Deployment[] | null>(null);
  const [models, setModels] = useState<Deployment[] | null>(null);

  const tabs = useMemo(
    () => [
      { id: TargetTab.Applications, label: t(MenuI18nKey.Applications) },
      { id: TargetTab.Models, label: t(MenuI18nKey.Models) },
      { id: TargetTab.Mcp, label: t(EntitiesI18nKey.MCP) },
    ],
    [t],
  );

  useEffect(() => {
    if (activeTab === TargetTab.Applications && applications == null) {
      getDeployments(DeploymentType.Application).then((res) => {
        if (res?.success) {
          setApplications(res.response || []);
        }
      });
    }
    if (activeTab === TargetTab.Models && models == null) {
      getDeployments(DeploymentType.Model).then((res) => {
        if (res?.success) {
          setModels(res.response || []);
        }
      });
    }
  }, [activeTab, applications, models]);

  const deployments = activeTab === TargetTab.Models ? models : applications;

  const onDeploymentSelect = useCallback(
    (deployment: Deployment) => {
      onChangeApplication(deployment);
      onChange((prev: TestSuite) => ({ ...prev, ...buildDeploymentUpdate(deployment) }));
    },
    [onChangeApplication, onChange],
  );

  const onMcpSelect = useCallback(
    (deployment: Deployment) => {
      onChangeApplication(deployment);
      onChange((prev: TestSuite) => ({ ...prev, ...buildMcpDeploymentUpdate(deployment) }));
    },
    [onChangeApplication, onChange],
  );

  const columnDefs = useMemo(() => EVALUATION_DEPLOYMENTS_COLUMNS(t), [t]);

  const isDeploymentTab = activeTab === TargetTab.Applications || activeTab === TargetTab.Models;

  return (
    <div className="size-full flex flex-col">
      <div className="flex flex-row mb-4 items-center justify-between">
        <div className="flex-1 min-w-0">
          <DialTabs tabs={tabs} activeTab={activeTab} onClick={setActiveTab} />
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {isDeploymentTab && (
          <RadioSelectGrid
            data={deployments}
            columnDefs={columnDefs}
            idField="deploymentId"
            initialSelectedId={selectedApplicationId}
            emptyTitle={t(EntitiesI18nKey.NoApplications)}
            onSelect={onDeploymentSelect}
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
