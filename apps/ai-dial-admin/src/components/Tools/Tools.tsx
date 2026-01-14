import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AlertVariant, DialAlert, DialLoader, DialNoDataContent, DialSwitch } from '@epam/ai-dial-ui-kit';
import { isEqual } from 'lodash';

import { getAssetTools } from '@/src/app/[lang]/assets-toolsets/actions';
import { getTools } from '@/src/app/[lang]/toolsets/actions';
import { getContainerTools } from '@/src/app/actions/deployments';
import Search from '@/src/components/Common/Search/Search';
import ToolsFilter from '@/src/components/Tools/Filter/ToolsFilter';
import { ToolFilter } from '@/src/components/Tools/type';
import { getFilteredTools } from '@/src/components/Tools/utils';
import { EntitiesI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { Tool, Toolset } from '@/src/models/dial/toolset';
import { getErrorNotification } from '@/src/utils/notification';
import ToolComponent from './Tool/Tool';

const filtersConfiguration = [
  ToolFilter.Enabled,
  ToolFilter.Disabled,
  ToolFilter.AutoDetected,
  ToolFilter.AddedManually,
];

interface Props {
  containerId?: string;
  originalToolset?: Toolset;
  selectedToolset?: Toolset;
  isAssetToolset?: boolean;
  isMcpToolset?: boolean;
  readonly?: boolean;
  onChangeToolset?: (toolset: Toolset) => void;
}

const Tools: FC<Props> = ({
  containerId,
  originalToolset,
  selectedToolset,
  isAssetToolset,
  isMcpToolset,
  readonly,
  onChangeToolset,
}) => {
  const t = useI18n();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const { showNotification } = useNotification();
  const [useAllTools, setUseAllTools] = useState(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [tools, setTools] = useState<Tool[] | null>(null);
  const [displayTools, setDisplayTools] = useState<Tool[] | null>(null);
  const [search, setSearch] = useState<string>('');
  const [selectedFilters, setSelectedFilters] = useState(filtersConfiguration);

  const isNotSavedToolset = useMemo(() => {
    return originalToolset?.endpoint !== selectedToolset?.endpoint;
  }, [originalToolset, selectedToolset]);

  const onSelectAll = useCallback(() => {
    if (isEqual(filtersConfiguration, selectedFilters)) {
      setSelectedFilters([]);
    } else {
      setSelectedFilters(filtersConfiguration);
    }
  }, [selectedFilters]);

  const onSelectFilter = useCallback(
    (value: boolean | undefined, filter: ToolFilter) => {
      if (value) {
        setSelectedFilters((prev) => [...prev, filter]);
      } else {
        setSelectedFilters((prev) => prev.filter((f) => f !== filter));
      }
    },
    [setSelectedFilters],
  );

  useEffect(() => {
    if (selectedToolset?.name && !isMcpToolset) {
      setLoading(true);
      (isAssetToolset ? getAssetTools((selectedToolset as AssetToolset)?.path) : getTools(selectedToolset?.name)).then(
        (tools) => {
          setLoading(false);
          setTools(tools || []);
        },
      );
    }
  }, [isAssetToolset, isMcpToolset, selectedToolset]);

  useEffect(() => {
    const fetchTools = async (id: string) => {
      setLoading(true);
      const res = await getContainerTools(id);
      if (!res.success) {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      } else {
        if (res.response) {
          setTools((res.response as { tools: Tool[] }).tools);
        }
      }
      setLoading(false);
    };

    if (isMcpToolset && containerId) {
      fetchTools(containerId).catch((error) => console.error(`Getting container tools error: ${error}`));
    }
  }, [isMcpToolset, containerId, showNotification]);

  useEffect(() => {
    setUseAllTools(!selectedToolset?.allowedTools || selectedToolset?.allowedTools.length === 0);
  }, [selectedToolset]);

  useEffect(() => {
    if (!tools?.length) return;

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      if (search.length) {
        const searchText = search.toLowerCase().trim();

        setDisplayTools(
          isMcpToolset
            ? tools.filter(
                (tool) =>
                  tool.name.toLowerCase().includes(searchText) ||
                  tool.description?.toLowerCase().includes(searchText) ||
                  JSON.stringify(tool.inputSchema?.properties)?.toLowerCase().includes(searchText) ||
                  JSON.stringify(tool.annotations)?.toLowerCase().includes(searchText),
              )
            : getFilteredTools(selectedToolset?.allowedTools || [], selectedFilters, tools).filter(
                (tool) => tool.name.toLowerCase().includes(searchText) && tool.name !== '',
              ),
        );
      } else {
        setDisplayTools(tools);
      }
    }, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tools]);

  if (loading) {
    return <DialLoader size={40} />;
  }

  if (!loading && (!tools?.length || !tools)) {
    return <DialNoDataContent title={t(EntitiesI18nKey.NoTools)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row items-center mb-3">
        <h1 className="mr-4">
          {t(ToolsetI18nKey.Tools)}
          {`: ${displayTools?.length || 0}`}
        </h1>

        {!readonly && !isMcpToolset && (
          <DialSwitch
            switchId="useAllTools"
            label={t(ToolsetI18nKey.UseAllTools)}
            isOn={useAllTools}
            onChange={(value) =>
              onChangeToolset?.({
                ...selectedToolset,
                allowedTools: value
                  ? []
                  : originalToolset?.allowedTools?.length
                    ? [...originalToolset.allowedTools]
                    : [''],
              })
            }
          />
        )}
      </div>
      <div className="flex flex-row items-center mb-3 justify-between">
        <div className="w-[480px]">
          <Search onChange={(search) => setSearch(search)} />
        </div>

        {!useAllTools && !isMcpToolset && (
          <div className="flex items-center gap-x-6">
            <ToolsFilter
              isAllSelected={isEqual(filtersConfiguration, selectedFilters)}
              onSelectAll={onSelectAll}
              selectedFilters={selectedFilters}
              onSelectFilter={onSelectFilter}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {displayTools?.map((tool, index) => {
          return (
            <ToolComponent
              tool={tool}
              key={index}
              isAddedManual={!tools?.some((t) => t.name === tool.name)}
              isMcpToolset={isMcpToolset}
              isAssetToolset={isAssetToolset}
              toolSetName={(isAssetToolset ? (selectedToolset as AssetToolset)?.path : selectedToolset?.name) || ''}
            />
          );
        })}
      </div>

      {isNotSavedToolset && !readonly && (
        <DialAlert variant={AlertVariant.Info} message={t(ToolsetI18nKey.ToolsWarning)} />
      )}
      {!useAllTools && !readonly && <span className="tiny text-secondary">{t(ToolsetI18nKey.Warning)}</span>}
    </div>
  );
};

export default Tools;
