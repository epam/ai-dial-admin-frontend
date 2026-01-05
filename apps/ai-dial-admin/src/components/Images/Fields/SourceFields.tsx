import { FC } from 'react';
import classNames from 'classnames';

import { IMAGE_SOURCE_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import { Image } from '@/src/models/deployments/images';

import BaseDirectoryField from '@/src/components/Images/Fields/SourceFields/BaseDirectoryField';
import BranchFields from '@/src/components/Images/Fields/SourceFields/BranchFields';
import SourceAddressField from '@/src/components/Images/Fields/SourceFields/SourceAddressField';
import SourceTypeFields from '@/src/components/Images/Fields/SourceFields/SourceTypeFields';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
  isModal?: boolean;
}

const SourceFields: FC<Props> = ({ image, setImage, isModal }) => {
  return (
    <div className={classNames('flex flex-col', isModal ? 'gap-4' : 'lg:w-[35%] gap-8')}>
      <div className={classNames('flex gap-4', isModal ? 'flex-col' : 'flex-row')}>
        {(isModal || image.$type === IMAGE_TYPE.MCP) && (
          <SourceTypeFields image={image} setImage={setImage} isModal={isModal} />
        )}
        <SourceAddressField image={image} setImage={setImage} />
      </div>
      {image.source?.$type === IMAGE_SOURCE_TYPE.CODE && (
        <div className={classNames('flex flex-col', isModal ? 'gap-4' : 'gap-8')}>
          <BranchFields image={image} setImage={setImage} />
          {!isModal && <BaseDirectoryField image={image} setImage={setImage} />}
        </div>
      )}
    </div>
  );
};

export default SourceFields;
