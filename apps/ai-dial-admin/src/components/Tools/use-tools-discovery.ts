import { useEffect, useState } from 'react';

import { getAllowedTools, getTools } from '@/src/app/[lang]/applications/actions';
import { getAssetAllowedTools, getAssetTools } from '@/src/app/[lang]/assets-applications/actions';
import { getAssetTools as getAssetToolsetTools } from '@/src/app/[lang]/assets-toolsets/actions';
import { getTools as getToolsetTools } from '@/src/app/[lang]/toolsets/actions';
import { getContainerTools } from '@/src/app/actions/deployments';
import { ToolsDiscoveryParams } from '@/src/components/Tools/models';
import { useNotification } from '@/src/context/NotificationContext';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { Tool } from '@/src/models/dial/toolset';
import { getErrorNotification } from '@/src/utils/notification';

export const useToolsDiscovery = ({
  originalEntity,
  selectedEntity,
  isRunnerApplication,
  isAsset,
  isMcpToolset,
  isApplicationTools,
  containerId,
}: ToolsDiscoveryParams) => {
  const { showNotification } = useNotification();
  const [isLoading, setLoading] = useState<boolean>(!!isRunnerApplication && !!originalEntity?.name);
  const [tools, setTools] = useState<Tool[] | null>(null);
  const savedAssetPath = (originalEntity as AssetToolset | undefined)?._metadata?.path;
  const savedName = originalEntity?.name;

  useEffect(() => {
    let isCancelled = false;
    if (selectedEntity?.name && !isMcpToolset && !isRunnerApplication) {
      let getFunction;
      if (isApplicationTools) {
        getFunction = isAsset ? getAssetTools : getTools;
      } else {
        getFunction = isAsset ? getAssetToolsetTools : getToolsetTools;
      }
      const path = (isAsset ? (selectedEntity as AssetToolset)._metadata?.path : selectedEntity?.name) as string;
      setLoading(true);
      getFunction(path).then((res) => {
        if (isCancelled) return;
        if (res.success) {
          setTools((res.response as { tools: Tool[] }).tools || []);
        } else {
          setTools([]);
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
        setLoading(false);
      });
    }
    return () => {
      isCancelled = true;
    };
  }, [isApplicationTools, isAsset, isMcpToolset, isRunnerApplication, selectedEntity, showNotification]);

  useEffect(() => {
    if (!isRunnerApplication || !savedName) return;
    let isCancelled = false;
    const fetchAllowedTools = async () => {
      setLoading(true);
      setTools([]);
      try {
        const res =
          isAsset && savedAssetPath ? await getAssetAllowedTools(savedAssetPath) : await getAllowedTools(savedName);
        if (isCancelled) return;
        if (res.success) {
          setTools((res.response as { tools: Tool[] }).tools || []);
        } else {
          setTools([]);
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      } catch (error) {
        if (isCancelled) return;
        setTools([]);
        showNotification(getErrorNotification(undefined, error instanceof Error ? error.message : undefined));
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    void fetchAllowedTools();
    return () => {
      isCancelled = true;
    };
  }, [isRunnerApplication, isAsset, savedAssetPath, savedName, showNotification]);

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

  return { tools, isLoading };
};
