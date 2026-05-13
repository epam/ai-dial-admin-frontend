import { FC, useCallback, useMemo, useState } from 'react';
import classNames from 'classnames';

import { IMAGE_SOURCE_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import { Image } from '@/src/models/deployments/images';
import { getControlClassName } from '@/src/utils/entities/view';
import { McpServer } from '@/src/types/deployments/mcp-registry';
import { hasRepoAndOci } from '@/src/utils/deployments/mcp-registry';

import BaseDirectory from '@/src/components/Deployments/Fields/ImageSource/BaseDirectory';
import Branch from '@/src/components/Deployments/Fields/ImageSource/Branch';
import SourceType from '@/src/components/Deployments/Fields/ImageSource/SourceType';
import CodeURL from '@/src/components/Deployments/Fields/ImageSource/CodeURL';
import DockerURI from '@/src/components/Deployments/Fields/ImageSource/DockerURI';
import ImageMcpRegistry from '@/src/components/Deployments/Fields/ImageSource/ImageMcpRegistry';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
  isModal?: boolean;
  verifyVersion: (image: Image) => void;
}

const ImageSource: FC<Props> = ({ image, setImage, isModal = false, verifyVersion }) => {
  const className = useMemo(() => getControlClassName(isModal), [isModal]);
  const hasExternalRegistryRef = !!image.source?.externalRegistryRef;

  const [registryServer, setRegistryServer] = useState<McpServer | undefined>(undefined);
  const serverHasBoth = registryServer ? hasRepoAndOci(registryServer) : false;

  const onServerChange = useCallback((server: McpServer | undefined) => {
    setRegistryServer(server);
  }, []);

  const isRegistryView = hasExternalRegistryRef && !isModal;
  const showSourceType =
    (isModal && !hasExternalRegistryRef) ||
    (image.$type === IMAGE_TYPE.MCP &&
      (!hasExternalRegistryRef || (isModal && registryServer && serverHasBoth) || isRegistryView));

  return (
    <div className="flex flex-col gap-y-8">
      {hasExternalRegistryRef && (
        <div className={classNames('flex', isModal ? 'flex-col gap-y-8' : 'flex-row gap-x-4')}>
          <ImageMcpRegistry
            image={image}
            setImage={setImage}
            selectedServer={registryServer}
            onServerChange={onServerChange}
            isModal={isModal}
          />
        </div>
      )}

      {(showSourceType || !isModal || !hasExternalRegistryRef) && (
        <div className={classNames('flex', isModal ? 'flex-col gap-y-8' : 'flex-row gap-x-4', className)}>
          {showSourceType && (
            <SourceType
              image={image}
              setImage={setImage}
              isModal={isModal}
              verifyVersion={verifyVersion}
              registryServer={registryServer}
            />
          )}
          {(!isModal || !hasExternalRegistryRef) && (
            <div className="flex-1">
              {image.source?.$type === IMAGE_SOURCE_TYPE.CODE && (
                <CodeURL image={image} setImage={setImage} disabled={hasExternalRegistryRef} />
              )}
              {image.source?.$type === IMAGE_SOURCE_TYPE.DOCKER && (
                <DockerURI image={image} setImage={setImage} disabled={hasExternalRegistryRef} />
              )}
            </div>
          )}
        </div>
      )}

      {image.source?.$type === IMAGE_SOURCE_TYPE.CODE && (
        <>
          <Branch image={image} setImage={setImage} isModal={isModal} />
          {!isModal && <BaseDirectory image={image} setImage={setImage} />}
        </>
      )}
    </div>
  );
};

export default ImageSource;
