import { FC, useMemo } from 'react';
import classNames from 'classnames';

import { IMAGE_SOURCE_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import { Image } from '@/src/models/deployments/images';

import BaseDirectoryField from '@/src/components/Images/Fields/SourceFields/BaseDirectoryField';
import BranchFields from '@/src/components/Images/Fields/SourceFields/BranchFields';
import SourceTypeFields from '@/src/components/Images/Fields/SourceFields/SourceTypeFields';
import CodeURL from '@/src/components/Images/Fields/SourceFields/CodeURL/CodeURL';
import DockerURI from '@/src/components/Images/Fields/SourceFields/DockerURI/DockerURI';
import { getControlClassName } from '@/src/utils/entities/view';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
  isModal?: boolean;
  verifyVersion: (image: Image) => void;
}

const SourceFields: FC<Props> = ({ image, setImage, isModal = false, verifyVersion }) => {
  const className = useMemo(() => getControlClassName(isModal), [isModal]);

  return (
    <div className="flex flex-col gap-y-8">
      <div className={classNames('flex', isModal ? 'flex-col gap-y-8' : 'flex-row gap-x-4', className)}>
        {(isModal || image.$type === IMAGE_TYPE.MCP) && (
          <SourceTypeFields image={image} setImage={setImage} isModal={isModal} verifyVersion={verifyVersion} />
        )}
        <div className="flex-1">
          {image.source?.$type === IMAGE_SOURCE_TYPE.CODE && <CodeURL image={image} setImage={setImage} />}
          {image.source?.$type === IMAGE_SOURCE_TYPE.DOCKER && <DockerURI image={image} setImage={setImage} />}
        </div>
      </div>

      {image.source?.$type === IMAGE_SOURCE_TYPE.CODE && (
        <>
          <BranchFields image={image} setImage={setImage} isModal={isModal} />
          {!isModal && <BaseDirectoryField image={image} setImage={setImage} />}
        </>
      )}
    </div>
  );
};

export default SourceFields;
