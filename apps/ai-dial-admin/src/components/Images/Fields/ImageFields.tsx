import { FC } from 'react';
import classNames from 'classnames';

import { Image } from '@/src/models/deployments/images';

import BaseFields from '@/src/components/Images/Fields/BaseFields';
import SourceFields from '@/src/components/Images/Fields/SourceFields';
import TransportField from '@/src/components/Images/Fields/TransportField';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
  isModal?: boolean;
}

const ImageFields: FC<Props> = ({ image, setImage, isModal }) => {
  return (
    <div className="flex flex-col w-full h-full gap-8">
      <div className={classNames('flex flex-col gap-4', !isModal && 'divide-y divide-primary gap-8')}>
        <div>
          <BaseFields image={image} setImage={setImage} isModal={isModal} />
        </div>
        <div className={classNames(!isModal && 'pt-8')}>
          <SourceFields image={image} setImage={setImage} isModal={isModal} />
        </div>
      </div>
      {!isModal && (
        <>
          <TransportField image={image} setImage={setImage} />
        </>
      )}
    </div>
  );
};

export default ImageFields;
