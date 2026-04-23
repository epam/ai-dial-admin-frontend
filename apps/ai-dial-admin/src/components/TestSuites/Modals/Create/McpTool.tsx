'use client';

import { FC, useEffect, useState } from 'react';

import { getDeploymentTools } from '@/src/app/[lang]/test-suites/actions';
import RadioSelectGrid from '@/src/components/Grid/GridView/RadioSelectGrid';
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
  const [isLoading, setIsLoading] = useState(false);
  const [tools, setTools] = useState<ToolDefinition[] | null>(null);

  useEffect(() => {
    setTools(null);
    setIsLoading(true);

    getDeploymentTools(deploymentId).then((res) => {
      if (res) {
        setTools(res);
      } else {
        setTools([]);
      }
      setIsLoading(false);
    });
  }, [deploymentId]);

  return (
    <RadioSelectGrid
      isLoading={isLoading}
      columnDefs={MCP_TOOLS_COLUMNS}
      data={tools}
      idField="name"
      onSelect={onSelect}
      selectedId={initialToolName}
      emptyTitle={t(TestSuitesI18nKey.NoToolsAvailable)}
    />
  );
};

export default McpTool;
