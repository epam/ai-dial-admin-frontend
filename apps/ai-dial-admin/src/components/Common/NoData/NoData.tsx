import { FC, ReactNode } from 'react';
import { IconClipboardX } from '@tabler/icons-react';

interface Props {
  icon?: ReactNode;
  emptyDataTitle: string;
}

const NoDataContent: FC<Props> = ({ icon, emptyDataTitle }) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-secondary">
      {icon || <IconClipboardX width={60} height={60} stroke={0.5} />}
      <span className="small mt-1 text-primary">{emptyDataTitle}</span>
    </div>
  );
};

export default NoDataContent;
