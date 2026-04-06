'use client';

import { FC, useEffect, useState } from 'react';

import { getDeployments } from '@/src/app/[lang]/test-suites/actions';
import RadioSelectGrid from '@/src/components/TestSuites/Modals/Create/RadioSelectGrid';
import { MCP_DEPLOYMENTS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';

interface Props {
  initialDeploymentId?: string;
  onSelect: (deployment: Deployment) => void;
}

const McpTargets: FC<Props> = ({ initialDeploymentId, onSelect }) => {
  const t = useI18n();
  const [deployments, setDeployments] = useState<Deployment[] | null>(null);

  useEffect(() => {
    getDeployments(undefined, 'mcp').then((res) => {
      if (res?.success) {
        setDeployments(res.response || []);
      }
    });
  }, []);

  return (
    <RadioSelectGrid
      data={deployments}
      columnDefs={MCP_DEPLOYMENTS_COLUMNS}
      idField="deploymentId"
      initialSelectedId={initialDeploymentId}
      emptyTitle={t(EntitiesI18nKey.NoApplications)}
      onSelect={onSelect}
    />
  );
};

export default McpTargets;
