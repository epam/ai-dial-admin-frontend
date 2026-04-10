import { FC, useCallback, useMemo } from 'react';
import classNames from 'classnames';

import { IMAGE_SOURCE_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import { Image } from '@/src/models/deployments/images';
import { getControlClassName } from '@/src/utils/entities/view';
import { McpServer } from '@/src/types/deployments/mcp-registry';
import { getImageMcpServers } from '@/src/app/actions/deployments';

import BaseDirectory from '@/src/components/Deployments/Fields/ImageSource/BaseDirectory';
import Branch from '@/src/components/Deployments/Fields/ImageSource/Branch';
import SourceType from '@/src/components/Deployments/Fields/ImageSource/SourceType';
import CodeURL from '@/src/components/Deployments/Fields/ImageSource/CodeURL';
import DockerURI from '@/src/components/Deployments/Fields/ImageSource/DockerURI';
import McpServerNameField from '@/src/components/Deployments/Fields/ContainerSource/McpServerNameField';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
  isModal?: boolean;
  verifyVersion: (image: Image) => void;
}

const ImageSource: FC<Props> = ({ image, setImage, isModal = false, verifyVersion }) => {
  const className = useMemo(() => getControlClassName(isModal), [isModal]);
  const hasExternalRegistryRef = !!image.source?.externalRegistryRef;
  const mcpServerName = useMemo(
    () => image.source?.externalRegistryRef?.packageName || '',
    [image.source?.externalRegistryRef?.packageName],
  );

  const onImageServerSelect = useCallback(
    (server: McpServer) => {
      setImage({
        ...image,
        source: {
          ...image.source,
          $type: IMAGE_SOURCE_TYPE.CODE,
          url: server.repository?.url || '',
          externalRegistryRef: {
            $type: 'mcp-registry',
            packageName: server.name,
            version: server.version,
          },
        },
      });
    },
    [image, setImage],
  );

  const onImageServerNameChange = useCallback(
    (name: string) => {
      setImage({
        ...image,
        source: {
          ...image.source,
          url: '',
          externalRegistryRef: { $type: 'mcp-registry', packageName: name },
        },
      });
    },
    [image, setImage],
  );

  return (
    <div className="flex flex-col gap-y-8">
      <div className={classNames('flex', isModal ? 'flex-col gap-y-8' : 'flex-row gap-x-4', className)}>
        {hasExternalRegistryRef ? (
          <McpServerNameField
            fetchServers={getImageMcpServers}
            onServerSelect={onImageServerSelect}
            serverName={mcpServerName}
            onServerNameChange={onImageServerNameChange}
          />
        ) : (
          <>
            {(isModal || image.$type === IMAGE_TYPE.MCP) && (
              <SourceType image={image} setImage={setImage} isModal={isModal} verifyVersion={verifyVersion} />
            )}
            <div className="flex-1">
              {image.source?.$type === IMAGE_SOURCE_TYPE.CODE && <CodeURL image={image} setImage={setImage} />}
              {image.source?.$type === IMAGE_SOURCE_TYPE.DOCKER && <DockerURI image={image} setImage={setImage} />}
            </div>
          </>
        )}
      </div>

      {image.source?.$type === IMAGE_SOURCE_TYPE.CODE && !(hasExternalRegistryRef && isModal) && (
        <>
          <Branch image={image} setImage={setImage} isModal={isModal} />
          {!isModal && <BaseDirectory image={image} setImage={setImage} />}
        </>
      )}
    </div>
  );
};

export default ImageSource;
