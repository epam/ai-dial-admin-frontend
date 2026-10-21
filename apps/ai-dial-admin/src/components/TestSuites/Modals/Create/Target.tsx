'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialTabs } from '@epam/ai-dial-ui-kit';

import { getDeployments, getRoutes } from '@/src/app/[lang]/test-suites/actions';
import RadioSelectGrid from '@/src/components/Grid/GridView/RadioSelectGrid';
import {
  EVALUATION_DEPLOYMENTS_COLUMNS,
  EVALUATION_ROUTES_COLUMNS,
  MCP_DEPLOYMENTS_COLUMNS,
} from '@/src/constants/grid-columns/grid-columns';
import { MCP_INTERFACE_FILTER } from '@/src/constants/deployment-interfaces';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Deployment, DeploymentType, RouteTarget } from '@/src/models/evaluation/deployment';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import { TargetTab } from './types';
import { applyTargetSelection, buildRouteUpdate, getInitialTab } from './utils';

type TargetItem = Deployment | RouteTarget;

const isRouteTarget = (target: TargetItem): target is RouteTarget => !('deploymentId' in target);

interface Props {
  selectedTargetId?: string;
  suiteType?: SuiteType;
  onChangeTarget: (deployment: Deployment | null) => void;
  onChange: Dispatch<SetStateAction<TestSuite>>;
}

const Target: FC<Props> = ({ selectedTargetId, suiteType, onChangeTarget, onChange }) => {
  const t = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(getInitialTab(suiteType));
  const [targets, setTargets] = useState<TargetItem[] | null>(null);
  const initialSelectedIdRef = useRef(selectedTargetId);
  const hasSwitchedTabRef = useRef(false);
  // Targets per tab don't change while the modal is open, so cache each tab's result here to
  // avoid re-fetching every time the user switches back to a previously loaded tab.
  const targetsByTabRef = useRef<Map<string, TargetItem[]>>(new Map());

  const tabs = useMemo(
    () => [
      { id: TargetTab.Applications, label: t(MenuI18nKey.Applications) },
      { id: TargetTab.Models, label: t(MenuI18nKey.Models) },
      { id: TargetTab.Mcp, label: t(EntitiesI18nKey.MCP) },
      { id: TargetTab.Routes, label: t(MenuI18nKey.Routes) },
    ],
    [t],
  );

  const onSelect = useCallback(
    (data: TargetItem) => {
      if (isRouteTarget(data)) {
        onChangeTarget(null);
        onChange((prev: TestSuite) => ({ ...prev, ...buildRouteUpdate(data) }));
        return;
      }
      onChangeTarget(data);
      onChange((prev: TestSuite) => applyTargetSelection(prev, data, activeTab));
    },
    [onChangeTarget, onChange, activeTab],
  );

  useEffect(() => {
    const cached = targetsByTabRef.current.get(activeTab);
    if (cached) {
      setTargets(cached);
      return;
    }

    setTargets([]);
    setIsLoading(true);

    let isCancelled = false;
    const loadTargets = async () => {
      let loadedTargets: TargetItem[] = [];
      try {
        if (activeTab === TargetTab.Routes) {
          loadedTargets = await getRoutes();
        } else {
          let type: DeploymentType | undefined;
          if (activeTab === TargetTab.Applications) type = DeploymentType.Application;
          if (activeTab === TargetTab.Models) type = DeploymentType.Model;
          const result = await getDeployments(type, activeTab === TargetTab.Mcp ? MCP_INTERFACE_FILTER : void 0);
          loadedTargets = result?.response || [];
        }
      } catch {
        loadedTargets = [];
      }

      if (!isCancelled) {
        targetsByTabRef.current.set(activeTab, loadedTargets);
        setTargets(loadedTargets);
        setIsLoading(false);
      }
    };

    void loadTargets();
    return () => {
      isCancelled = true;
    };
  }, [activeTab]);

  useEffect(() => {
    if (!initialSelectedIdRef.current || isLoading || targets === null) return;
    const found = targets.find((target) =>
      isRouteTarget(target)
        ? target.name === initialSelectedIdRef.current
        : target.deploymentId === initialSelectedIdRef.current,
    );
    if (found) {
      onChangeTarget(isRouteTarget(found) ? null : found);
      initialSelectedIdRef.current = undefined;
    } else if (activeTab === TargetTab.Applications && !hasSwitchedTabRef.current) {
      hasSwitchedTabRef.current = true;
      setActiveTab(TargetTab.Models);
    }
    // onChangeTarget is a stable setState setter; activeTab is read via closure after deps update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targets, isLoading]);

  let columnDefs = EVALUATION_DEPLOYMENTS_COLUMNS;
  if (activeTab === TargetTab.Mcp) columnDefs = MCP_DEPLOYMENTS_COLUMNS;
  if (activeTab === TargetTab.Routes) columnDefs = EVALUATION_ROUTES_COLUMNS;
  const idField = activeTab === TargetTab.Routes ? 'name' : 'deploymentId';
  const emptyTitle = t(activeTab === TargetTab.Routes ? EntitiesI18nKey.NoRoutes : EntitiesI18nKey.NoApplications);

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
          columnDefs={columnDefs}
          data={targets}
          idField={idField}
          onSelect={onSelect}
          selectedId={selectedTargetId}
          emptyTitle={emptyTitle}
        />
      </div>
    </div>
  );
};

export default Target;
