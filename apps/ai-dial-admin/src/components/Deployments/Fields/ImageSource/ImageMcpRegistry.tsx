import { FC, useCallback, useEffect, useRef } from 'react';

import { IMAGE_SOURCE_TYPE, IMAGE_TRANSPORT_TYPE } from '@/src/types/deployments/images';
import { Image } from '@/src/models/deployments/images';
import { McpServer, McpServerResponse } from '@/src/types/deployments/mcp-registry';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ApplicationRoute } from '@/src/types/routes';
import { getImageMcpServers } from '@/src/app/actions/deployments';
import { mapImageTransportType } from '@/src/utils/deployments/mcp-registry';
import McpServerNameField from '@/src/components/Deployments/Fields/ContainerSource/McpServerNameField';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
  selectedServer?: McpServer;
  onServerChange: (server: McpServer | undefined) => void;
  isModal?: boolean;
}

const hasRepo = (server: McpServer): boolean => !!server.repository?.url;
const getFirstOciPackage = (server: McpServer) => server.packages?.find((p) => p.registryType === 'oci');

const ImageMcpRegistry: FC<Props> = ({ image, setImage, selectedServer, onServerChange, isModal }) => {
  const serverName = image.source?.externalRegistryRef?.packageName || '';

  const onServerSelect = useCallback(
    (server: McpServer) => {
      onServerChange(server);
      const ref = { $type: SOURCE_TYPE.MCP_REGISTRY, packageName: server.name, version: server.version };
      const defaultSourceType = hasRepo(server) ? IMAGE_SOURCE_TYPE.CODE : IMAGE_SOURCE_TYPE.DOCKER;

      if (defaultSourceType === IMAGE_SOURCE_TYPE.CODE) {
        setImage({
          ...image,
          source: {
            $type: IMAGE_SOURCE_TYPE.CODE,
            url: server.repository?.url || '',
            externalRegistryRef: ref,
          },
        });
      } else {
        const ociPackage = getFirstOciPackage(server);
        const transportType = ociPackage?.transport?.type
          ? mapImageTransportType(ociPackage.transport.type)
          : IMAGE_TRANSPORT_TYPE.LOCAL;

        setImage({
          ...image,
          transportType,
          source: {
            $type: IMAGE_SOURCE_TYPE.DOCKER,
            imageUri: ociPackage?.identifier || '',
            externalRegistryRef: ref,
          },
        });
      }
    },
    [image, setImage, onServerChange],
  );

  const onServerNameChange = useCallback(
    (name: string) => {
      onServerChange(undefined);
      setImage({
        ...image,
        source: {
          ...image.source,
          externalRegistryRef: {
            $type: SOURCE_TYPE.MCP_REGISTRY,
            packageName: name,
            version: image.source?.externalRegistryRef?.version,
          },
        },
      });
    },
    [image, setImage, onServerChange],
  );

  const selectedVersion = image.source?.externalRegistryRef?.version;

  // Track the current name+version so a slow lookup that resolves after the user has
  // changed/cleared the input — or picked a different version — is recognised as
  // stale and ignored (Issue #3053).
  const latestLookupKeyRef = useRef('');
  latestLookupKeyRef.current = `${serverName}@${selectedVersion ?? ''}`;

  useEffect(() => {
    if (isModal || !serverName) return;
    const isMatch = selectedServer?.name === serverName && selectedServer?.version === selectedVersion;
    if (isMatch) return;

    const lookupKey = `${serverName}@${selectedVersion ?? ''}`;
    getImageMcpServers({ search: serverName, limit: 10 }).then(({ success, response }) => {
      if (!success) return;
      if (latestLookupKeyRef.current !== lookupKey) return;
      const servers = (response.servers || []).map((s: McpServerResponse) => s.server) as McpServer[];
      const exactMatch = selectedVersion
        ? servers.find((s) => s.name === serverName && s.version === selectedVersion)
        : servers.find((s) => s.name === serverName);
      onServerChange(exactMatch);
    });
  }, [isModal, serverName, selectedVersion, selectedServer, onServerChange]);

  return (
    <McpServerNameField
      fetchServers={getImageMcpServers}
      onServerSelect={onServerSelect}
      serverName={serverName}
      onServerNameChange={onServerNameChange}
      preselectedServer={
        image.source?.externalRegistryRef
          ? {
              name: image.source.externalRegistryRef.packageName,
              version: image.source.externalRegistryRef.version || '',
            }
          : undefined
      }
      view={ApplicationRoute.Images}
      isModal={isModal}
    />
  );
};

export default ImageMcpRegistry;
