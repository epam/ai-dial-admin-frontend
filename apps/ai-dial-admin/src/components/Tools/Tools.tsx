import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  AlertVariant,
  DialAlert,
  DialLoader,
  DialNoDataContent,
  DialPrimaryButton,
  DialSwitch,
} from '@epam/ai-dial-ui-kit';
import { isEqual } from 'lodash';

import { getTools } from '@/src/app/[lang]/applications/actions';
import { getAssetTools } from '@/src/app/[lang]/assets-applications/actions';
import { getAssetTools as getAssetToolsetTools } from '@/src/app/[lang]/assets-toolsets/actions';
import { getTools as getToolsetTools } from '@/src/app/[lang]/toolsets/actions';
import { getContainerTools } from '@/src/app/actions/deployments';
import Search from '@/src/components/Common/Search/Search';
import ToolsFilter from '@/src/components/Tools/Filter/ToolsFilter';
import { ToolFilter } from '@/src/components/Tools/type';
import { getFilteredTools } from '@/src/components/Tools/utils';
import { ButtonsI18nKey, EntitiesI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ApplicationMCPContainer, DialApplication } from '@/src/models/dial/application';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { Tool, Toolset } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { IconPencilMinus } from '@tabler/icons-react';
import ManageToolsModal from './ManageToolsModal/ManageToolsModal';
import ToolComponent from './Tool/Tool';

const filtersConfiguration = [ToolFilter.AutoDetected, ToolFilter.AddedManually];

interface Props {
  view?: ApplicationRoute;
  containerId?: string;
  originalEntity?: Toolset | DialApplication;
  selectedEntity?: Toolset | DialApplication;
  isAsset?: boolean;
  isMcpToolset?: boolean;
  isPublicationToolset?: boolean;
  disabled?: boolean;
  onChangeEntity?: (toolset: Toolset | DialApplication) => void;
}

const Tools: FC<Props> = ({
  view,
  containerId,
  originalEntity,
  selectedEntity,
  isAsset,
  isMcpToolset,
  isPublicationToolset,
  disabled,
  onChangeEntity,
}) => {
  const t = useI18n();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const { showNotification } = useNotification();
  const { sidebar } = useAppContext();
  const [useAllTools, setUseAllTools] = useState(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [tools, setTools] = useState<Tool[] | null>(null);
  const [displayTools, setDisplayTools] = useState<Tool[] | null>(null);
  const [search, setSearch] = useState<string>('');
  const [selectedFilters, setSelectedFilters] = useState(filtersConfiguration);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isNotSavedToolset = useMemo(() => {
    return originalEntity?.endpoint !== selectedEntity?.endpoint;
  }, [originalEntity, selectedEntity]);

  const isApplicationTools = useMemo(() => {
    return view === ApplicationRoute.Applications || view === ApplicationRoute.AssetsApplications;
  }, [view]);

  const manualAddedTools = useMemo(() => {
    const allowed = isApplicationTools
      ? (selectedEntity as DialApplication)?.mcp?.allowedTools || []
      : (selectedEntity as Toolset)?.allowedTools || [];
    return allowed.reduce((acc, curr) => {
      if (!tools?.some((tool) => tool.name === curr) && curr !== '') {
        acc.push({
          name: curr,
        });
      }
      return acc;
    }, [] as Tool[]);
  }, [isApplicationTools, selectedEntity, tools]);

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

  const onOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

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
      } else {
        onChangeEntity?.({
          ...(selectedEntity as Toolset),
          allowedTools: [],
        });
      }
    },
    [isApplicationTools, onChangeEntity, selectedEntity],
  );

  useEffect(() => {
    if (selectedEntity?.name && !isMcpToolset) {
      let getFunction;
      if (isApplicationTools) {
        getFunction = isAsset ? getAssetTools : getTools;
      } else {
        getFunction = isAsset ? getAssetToolsetTools : getToolsetTools;
      }
      const path = isAsset ? (selectedEntity as AssetToolset)?.path : selectedEntity?.name;
      setLoading(true);
      getFunction(path).then((tools) => {
        setLoading(false);
        setTools(tools || []);
      });
    }
  }, [isApplicationTools, isAsset, isMcpToolset, selectedEntity]);

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
    if (!tools?.length && !manualAddedTools?.length) {
      setDisplayTools([]);
      return;
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      const allTools = [...(tools || []), ...manualAddedTools];
      const allowedTools = isApplicationTools
        ? (selectedEntity as DialApplication)?.mcp?.allowedTools?.filter((toolName) => toolName !== '') || []
        : (selectedEntity as Toolset)?.allowedTools?.filter((toolName) => toolName !== '') || [];
      const allToolNames = allTools.map((tool) => tool.name);

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
                useAllTools ? allToolNames : allowedTools,
                useAllTools ? [...filtersConfiguration] : selectedFilters,
                tools || [],
              ).filter((tool) => tool.name.toLowerCase().includes(searchText) && tool.name !== ''),
        );
      } else {
        setDisplayTools(
          isMcpToolset
            ? allTools
            : getFilteredTools(
                useAllTools ? allToolNames : allowedTools,
                useAllTools ? [...filtersConfiguration] : selectedFilters,
                tools || [],
              ),
        );
      }
    }, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tools, manualAddedTools, selectedFilters, useAllTools]);

  useEffect(() => {
    setUseAllTools(
      isApplicationTools
        ? (originalEntity as DialApplication)?.mcp?.allowedTools?.length === 0
        : (originalEntity as Toolset)?.allowedTools?.length === 0,
    );
  }, [isApplicationTools, originalEntity]);

  useEffect(() => {
    return () => sidebar.closeSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <DialLoader size={40} />;
  }

  return (
    <div className="flex flex-col relative h-full overflow-hidden">
      <div className="flex flex-row items-center mb-3">
        <h1 className="mr-4">
          {t(ToolsetI18nKey.Tools)}
          {`: ${displayTools?.length || 0}`}
        </h1>

        {!disabled && !isMcpToolset && (
          <DialSwitch
            switchId="useAllTools"
            label={t(ToolsetI18nKey.UseAllTools)}
            isOn={useAllTools}
            onChange={onUseAllToolsSwitch}
          />
        )}
      </div>
      <div className="flex flex-row items-center mb-3 gap-x-4 justify-between">
        <div className="w-[480px]">
          <Search onChange={(search) => setSearch(search)} />
        </div>

        <div className="flex flex-row gap-4">
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
          {!disabled && !isMcpToolset && !useAllTools && (
            <DialPrimaryButton
              label={t(ButtonsI18nKey.ManageTool)}
              iconBefore={<IconPencilMinus {...BASE_BUTTON_ICON_PROPS} />}
              onClick={onOpenModal}
            />
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 mb-3">
        <div className="flex flex-col gap-6 overflow-y-auto h-full">
          {!displayTools?.length ? (
            <div className="flex items-center justify-center h-full">
              <DialNoDataContent title={t(EntitiesI18nKey.NoTools)} />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {displayTools?.map((tool, index) => {
                return (
                  <ToolComponent
                    tool={tool}
                    key={index}
                    disabled={disabled}
                    isAddedManual={!tools?.some((t) => t.name === tool.name)}
                    isMcpToolset={isMcpToolset}
                    isAssetToolset={isAsset}
                    isPublicationToolset={isPublicationToolset}
                    containerId={containerId}
                    toolSetName={(isAsset ? (selectedEntity as AssetToolset)?.path : selectedEntity?.name) || ''}
                    view={view}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isNotSavedToolset && !disabled && (
        <DialAlert variant={AlertVariant.Info} message={t(ToolsetI18nKey.ToolsWarning)} />
      )}
      {!useAllTools && !disabled && <span className="tiny text-secondary">{t(ToolsetI18nKey.Warning)}</span>}
      {isModalOpen && (
        <ManageToolsModal
          isModalOpen={isModalOpen}
          onClose={onCloseModal}
          tools={tools || []}
          originalEntity={selectedEntity || {}}
          onConfirm={onChangeEntity}
          view={view}
        />
      )}
    </div>
  );
};

export default Tools;
