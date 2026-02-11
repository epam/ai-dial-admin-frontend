import { FC, useMemo } from 'react';
import classNames from 'classnames';

import { IMAGE_SOURCE_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import { Image } from '@/src/models/deployments/images';
import { getControlClassName } from '@/src/utils/entities/view';

import BaseDirectory from '@/src/components/Deployments/Fields/ImageSource/BaseDirectory';
import Branch from '@/src/components/Deployments/Fields/ImageSource/Branch';
import SourceType from '@/src/components/Deployments/Fields/ImageSource/SourceType';
import CodeURL from '@/src/components/Deployments/Fields/ImageSource/CodeURL';
import DockerURI from '@/src/components/Deployments/Fields/ImageSource/DockerURI';


interface Props {
  image: Image;
  setImage: (image: Image) => void;
  isModal?: boolean;
  verifyVersion: (image: Image) => void;
}

const ImageSource: FC<Props> = ({ image, setImage, isModal = false, verifyVersion }) => {
  const className = useMemo(() => getControlClassName(isModal), [isModal]);

  return (
    <div className="flex flex-col gap-y-8">
      <div className={classNames('flex', isModal ? 'flex-col gap-y-8' : 'flex-row gap-x-4', className)}>
        {(isModal || image.$type === IMAGE_TYPE.MCP) && (
          <SourceType image={image} setImage={setImage} isModal={isModal} verifyVersion={verifyVersion} />
        )}
        <div className="flex-1">
          {image.source?.$type === IMAGE_SOURCE_TYPE.CODE && <CodeURL image={image} setImage={setImage} />}
          {image.source?.$type === IMAGE_SOURCE_TYPE.DOCKER && <DockerURI image={image} setImage={setImage} />}
        </div>
      </div>

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
