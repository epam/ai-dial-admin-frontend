'use client';

import { FC, useCallback } from 'react';

import { getToolsetMcpServers } from '@/src/app/actions/deployments';
import McpServerNameField from '@/src/components/Deployments/Fields/ContainerSource/McpServerNameField';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { Toolset } from '@/src/models/dial/toolset';
import { McpServer } from '@/src/types/deployments/mcp-registry';
import { ApplicationRoute } from '@/src/types/routes';
import { getPreferredRemote, mapRemoteTransportType } from '@/src/utils/deployments/mcp-registry';

interface Props {
  entity: Toolset;
  onChange: (entity: Toolset) => void;
  view: ApplicationRoute;
  isModal?: boolean;
  disabled?: boolean;
}

const McpRegistry: FC<Props> = ({ entity, onChange, view, isModal, disabled }) => {
  const serverName = entity.source?.serverName || '';
  const serverVersion = entity.source?.serverVersion || '';

  const preselectedServer = serverName ? { name: serverName, version: serverVersion } : undefined;

  const onServerSelect = useCallback(
    (server: McpServer) => {
      const preferredRemote = getPreferredRemote(server);
      const transport = preferredRemote?.type ? mapRemoteTransportType(preferredRemote.type) : undefined;

      onChange({
        ...entity,
        ...(preferredRemote ? { endpoint: preferredRemote.url } : {}),
        ...(transport ? { transport } : {}),
        source: {
          ...entity.source,
          $type: SOURCE_TYPE.MCP_REGISTRY,
          serverName: server.name,
          serverVersion: server.version,
        },
      });
    },
    [entity, onChange],
  );

  const onServerNameChange = useCallback(
    (name: string) => {
      onChange({
        ...entity,
        endpoint: '',
        source: {
          ...entity.source,
          $type: SOURCE_TYPE.MCP_REGISTRY,
          serverName: name,
        },
      });
    },
    [entity, onChange],
  );

  return (
    <McpServerNameField
      fetchServers={getToolsetMcpServers}
      onServerSelect={onServerSelect}
      serverName={serverName}
      onServerNameChange={onServerNameChange}
      preselectedServer={preselectedServer}
      view={view}
      isModal={isModal}
      disabled={disabled}
    />
  );
};

export default McpRegistry;
