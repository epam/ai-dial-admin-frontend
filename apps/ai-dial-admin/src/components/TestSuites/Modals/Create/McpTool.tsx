'use client';

import { FC, useEffect, useState } from 'react';

import { getDeploymentTools } from '@/src/app/[lang]/test-suites/actions';
import RadioSelectGrid from '@/src/components/TestSuites/Modals/Create/RadioSelectGrid';
import { MCP_TOOLS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ToolDefinition } from '@/src/models/evaluation/deployment';

interface Props {
  deploymentId: string;
  initialToolName?: string;
  onSelect: (tool: ToolDefinition) => void;
}

const McpTool: FC<Props> = ({ deploymentId, initialToolName, onSelect }) => {
  const t = useI18n();
  const [tools, setTools] = useState<ToolDefinition[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setTools(null);
    setError(false);
    getDeploymentTools(deploymentId).then((res) => {
      if (res) {
        setTools(res);
      } else {
        setError(true);
        setTools([]);
      }
    });
  }, [deploymentId]);

  return (
    <RadioSelectGrid
      data={tools}
      columnDefs={MCP_TOOLS_COLUMNS}
      idField="name"
      initialSelectedId={initialToolName}
      emptyTitle={t(TestSuitesI18nKey.NoToolsAvailable)}
      errorTitle={t(TestSuitesI18nKey.FailedToLoadTools)}
      hasError={error}
      onSelect={onSelect}
    />
  );
};

export default McpTool;
