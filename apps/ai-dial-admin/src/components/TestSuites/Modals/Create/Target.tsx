'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { DialTabs } from '@epam/ai-dial-ui-kit';

import { getDeployments } from '@/src/app/[lang]/test-suites/actions';
import { TEMP_FOLDER } from '@/src/constants/file';
import { EVALUATION_DEPLOYMENTS_COLUMNS, MCP_DEPLOYMENTS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Deployment, DeploymentType } from '@/src/models/evaluation/deployment';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import RadioSelectGrid from '@/src/components/Grid/GridView/RadioSelectGrid';
import { TargetTab } from './types';
import { buildDeploymentUpdate, buildMcpDeploymentUpdate, getInitialTab } from './utils';

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

  const onSelect = useCallback(
    (data: Deployment) => {
      onChangeTarget(data);
      onChange((prev: TestSuite) => ({
        ...prev,
        ...(activeTab === TargetTab.Mcp ? buildMcpDeploymentUpdate(data) : buildDeploymentUpdate(data)),
      }));
    },
    [onChangeTarget, onChange, activeTab],
  );

  useEffect(() => {
    setDeployments([]);
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
        <RadioSelectGrid
          isLoading={isLoading}
          columnDefs={activeTab === TargetTab.Mcp ? MCP_DEPLOYMENTS_COLUMNS : EVALUATION_DEPLOYMENTS_COLUMNS}
          data={deployments}
          idField="deploymentId"
          onSelect={onSelect}
          selectedId={selectedTargetId}
          emptyTitle={t(EntitiesI18nKey.NoApplications)}
        />
      </div>
    </div>
  );
};

export default Target;
