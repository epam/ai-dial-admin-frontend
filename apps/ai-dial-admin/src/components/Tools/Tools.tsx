import { FC, useCallback, useEffect, useState } from 'react';

import { Spinner } from '@epam/ai-dial-ui-kit';

import ManageToolsModal from '@/src/components/Tools/ManageToolsModal/ManageToolsModal';
import { ToolsEntity } from '@/src/components/Tools/models';
import ToolsNotifications from '@/src/components/Tools/ToolsNotifications';
import ToolsResults from '@/src/components/Tools/ToolsResults';
import ToolsToolbar from '@/src/components/Tools/ToolsToolbar';
import { useToolsDiscovery } from '@/src/components/Tools/use-tools-discovery';
import { useToolsDisplay } from '@/src/components/Tools/use-tools-display';
import { getToolsContext } from '@/src/components/Tools/utils';
import { useAppContext } from '@/src/context/AppContext';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { Toolset } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  view?: ApplicationRoute;
  containerId?: string;
  originalEntity?: ToolsEntity;
  selectedEntity?: ToolsEntity;
  isAsset?: boolean;
  isMcpToolset?: boolean;
  isRunnerApplication?: boolean;
  disabled?: boolean;
  onChangeEntity?: (toolset: Toolset | DialApplication) => void;
  appRunner?: DialApplicationScheme;
}

const Tools: FC<Props> = ({
  view,
  containerId,
  originalEntity,
  selectedEntity,
  isAsset,
  isMcpToolset,
  isRunnerApplication,
  disabled,
  onChangeEntity,
  appRunner,
}) => {
  const { sidebar } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { isApplicationTools, isAssetToolset, isAssetApplication, isManagementVisible, toolSetName } = getToolsContext({
    view,
    originalEntity,
    selectedEntity,
    isAsset,
    isMcpToolset,
    isRunnerApplication,
    disabled,
    appRunner,
  });

  const { tools, isLoading } = useToolsDiscovery({
    originalEntity,
    selectedEntity,
    isRunnerApplication,
    isAsset,
    isMcpToolset,
    isApplicationTools,
    containerId,
  });
  const {
    visibleTools,
    search,
    setSearch,
    selectedFilters,
    useAllTools,
    onSelectAll,
    onSelectFilter,
    onUseAllToolsSwitch,
  } = useToolsDisplay({
    originalEntity,
    selectedEntity,
    tools,
    isApplicationTools,
    isAssetToolset,
    isMcpToolset,
    isRunnerApplication,
    appRunner,
    onChangeEntity,
  });

  const onOpenModal = useCallback(() => setIsModalOpen(true), []);
  const onCloseModal = useCallback(() => setIsModalOpen(false), []);

  useEffect(() => {
    if (isLoading || !isRunnerApplication) setIsSearching(false);
  }, [isLoading, isRunnerApplication]);

  useEffect(() => {
    return () => sidebar.closeSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) return <Spinner size={40} fullWidth />;

  return (
    <div className="flex flex-col relative h-full overflow-hidden">
      <ToolsToolbar
        toolsCount={visibleTools?.length || 0}
        isRunnerApplication={isRunnerApplication}
        isSearching={isSearching}
        isManagementVisible={isManagementVisible}
        useAllTools={useAllTools}
        search={search}
        selectedFilters={selectedFilters}
        onSearchChange={setSearch}
        onSearchPendingChange={setIsSearching}
        onUseAllToolsSwitch={onUseAllToolsSwitch}
        onSelectAll={onSelectAll}
        onSelectFilter={onSelectFilter}
        onOpenModal={onOpenModal}
      />
      <ToolsResults
        tools={tools}
        visibleTools={visibleTools}
        isSearching={isSearching}
        disabled={disabled}
        isMcpToolset={isMcpToolset}
        isAssetToolset={isRunnerApplication ? isAssetApplication : isAsset}
        containerId={containerId}
        toolSetName={toolSetName}
        view={view}
      />
      <ToolsNotifications
        originalEntity={originalEntity}
        selectedEntity={selectedEntity}
        isRunnerApplication={isRunnerApplication}
        isUsingAllTools={useAllTools}
        disabled={disabled}
      />
      {isModalOpen && !isRunnerApplication && (
        <ManageToolsModal
          isModalOpen={isModalOpen}
          onClose={onCloseModal}
          tools={tools || []}
          originalEntity={(selectedEntity || {}) as Toolset}
          onConfirm={onChangeEntity}
          view={view}
          isAsset={isAsset}
        />
      )}
    </div>
  );
};

export default Tools;
