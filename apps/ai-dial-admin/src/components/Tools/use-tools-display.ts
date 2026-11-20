import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isEqual } from 'lodash';

import { TOOL_FILTERS_CONFIGURATION } from '@/src/components/Tools/constants';
import { ToolsDisplayParams, ToolsEntity } from '@/src/components/Tools/models';
import { ToolFilter } from '@/src/components/Tools/type';
import { getAllTools, getFilteredTools } from '@/src/components/Tools/utils';
import { ApplicationMCPContainer, DialApplication } from '@/src/models/dial/application';
import { DialToolsetResource } from '@/src/models/dial/resource';
import { Tool, Toolset } from '@/src/models/dial/toolset';

export const useToolsDisplay = ({
  originalEntity,
  selectedEntity,
  tools,
  isApplicationTools,
  isAssetToolset,
  isMcpToolset,
  isRunnerApplication,
  appRunner,
  onChangeEntity,
}: ToolsDisplayParams) => {
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [useAllTools, setUseAllTools] = useState(false);
  const [displayTools, setDisplayTools] = useState<Tool[] | null>(null);
  const [search, setSearch] = useState('');
  const [selectedFilters, setSelectedFilters] = useState(TOOL_FILTERS_CONFIGURATION);

  const runnerTools = useMemo(() => appRunner?.['dial:applicationTypeMcp']?.['dial:allowedTools'] || [], [appRunner]);

  const getEntityAllowedTools = useCallback(
    (entity?: ToolsEntity): string[] | undefined => {
      if (isApplicationTools) return (entity as DialApplication)?.mcp?.allowedTools;
      if (isAssetToolset) return (entity as DialToolsetResource)?.allowed_tools;
      return (entity as Toolset)?.allowedTools;
    },
    [isApplicationTools, isAssetToolset],
  );

  const manualAddedTools = useMemo(() => {
    const allowed = getEntityAllowedTools(selectedEntity) || [];
    return allowed.reduce((acc: Tool[], name) => {
      if (!tools?.some((tool) => tool.name === name) && name !== '') acc.push({ name });
      return acc;
    }, []);
  }, [getEntityAllowedTools, selectedEntity, tools]);

  const visibleTools = useMemo(() => {
    if (!isRunnerApplication) return displayTools;
    const searchText = search.toLowerCase().trim();
    return (tools || []).filter((tool) => tool.name.toLowerCase().includes(searchText));
  }, [displayTools, isRunnerApplication, search, tools]);

  const onSelectAll = useCallback(() => {
    if (isEqual(TOOL_FILTERS_CONFIGURATION, selectedFilters)) {
      setSelectedFilters([]);
    } else {
      setSelectedFilters(TOOL_FILTERS_CONFIGURATION);
    }
  }, [selectedFilters]);

  const onSelectFilter = useCallback((value: boolean | undefined, filter: ToolFilter) => {
    if (value) {
      setSelectedFilters((prev) => [...prev, filter]);
    } else {
      setSelectedFilters((prev) => prev.filter((item) => item !== filter));
    }
  }, []);

  const onUseAllToolsSwitch = useCallback(
    (value: boolean) => {
      setUseAllTools(value);
      if (isApplicationTools) {
        onChangeEntity?.({
          ...(selectedEntity as DialApplication),
          mcp: {
            ...((selectedEntity as DialApplication)?.mcp || {}),
            allowedTools: [],
          } as ApplicationMCPContainer,
        });
      } else if (isAssetToolset) {
        onChangeEntity?.({
          ...(selectedEntity as Toolset),
          allowed_tools: [],
        } as unknown as Toolset);
      } else {
        onChangeEntity?.({ ...(selectedEntity as Toolset), allowedTools: [] });
      }
    },
    [isApplicationTools, isAssetToolset, onChangeEntity, selectedEntity],
  );

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('fourth eff');

    if (isRunnerApplication) return;
    if (!tools?.length && !manualAddedTools?.length) {
      setDisplayTools([]);
      return;
    }
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      const allTools = [...(tools || []), ...manualAddedTools];
      const allowedTools = getEntityAllowedTools(selectedEntity)?.filter((name) => name !== '') || [];
      const allToolNames = allTools.map((tool) => tool.name);
      const filteredTools = getAllTools(useAllTools, allToolNames, !!appRunner, runnerTools, allowedTools);

      if (search.length) {
        const searchText = search.toLowerCase().trim();
        setDisplayTools(
          isMcpToolset
            ? allTools.filter(
                (tool) =>
                  tool.name.toLowerCase().includes(searchText) ||
                  tool.description?.toLowerCase().includes(searchText) ||
                  JSON.stringify(tool.inputSchema?.properties)?.toLowerCase().includes(searchText) ||
                  JSON.stringify(tool.annotations)?.toLowerCase().includes(searchText),
              )
            : getFilteredTools(
                filteredTools,
                useAllTools ? [...TOOL_FILTERS_CONFIGURATION] : selectedFilters,
                tools || [],
              ).filter((tool) => tool.name.toLowerCase().includes(searchText) && tool.name !== ''),
        );
      } else {
        setDisplayTools(
          isMcpToolset
            ? allTools
            : getFilteredTools(
                filteredTools,
                useAllTools ? [...TOOL_FILTERS_CONFIGURATION] : selectedFilters,
                tools || [],
              ),
        );
      }
    }, 300);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tools, manualAddedTools, selectedFilters, useAllTools, isRunnerApplication]);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('fifth eff');

    setUseAllTools(getEntityAllowedTools(originalEntity)?.length === 0);
  }, [getEntityAllowedTools, originalEntity]);

  return {
    visibleTools,
    search,
    setSearch,
    selectedFilters,
    useAllTools,
    onSelectAll,
    onSelectFilter,
    onUseAllToolsSwitch,
  };
};
