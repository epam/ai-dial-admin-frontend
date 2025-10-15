import { IconEyeOff } from '@tabler/icons-react';
import { FC } from 'react';

interface Props {
  text: string;
}

const NoPreview: FC<Props> = ({ text }) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-secondary bg-layer-3">
      <IconEyeOff width={50} height={50} />
      <span className="small mt-1 text-primary">{text}</span>
    </div>
  );
};

export default NoPreview;
