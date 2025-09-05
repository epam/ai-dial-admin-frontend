import { FC, ReactNode } from 'react';
import { IconClipboardX } from '@tabler/icons-react';

interface Props {
  icon?: ReactNode;
  emptyDataTitle: string;
}

const NoDataContent: FC<Props> = ({ icon, emptyDataTitle }) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-secondary">
      {icon || <IconClipboardX width={60} height={60} />}
      <span className="small mt-2 text-primary">{emptyDataTitle}</span>
    </div>
  );
};

export default NoDataContent;
