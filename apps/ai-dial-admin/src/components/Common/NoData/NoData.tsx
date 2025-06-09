import { FC } from 'react';
import { IconClipboardX } from '@tabler/icons-react';

interface Props {
  emptyDataTitle: string;
  dataTestId?: string;
}

const NoDataContent: FC<Props> = ({ emptyDataTitle, dataTestId }) => {
  return (
    <div data-testid={dataTestId} className="h-full w-full flex flex-col items-center justify-center text-secondary">
      <IconClipboardX width={60} height={60} stroke={0.5} />
      <span className="small mt-1 text-primary">{emptyDataTitle}</span>
    </div>
  );
};

export default NoDataContent;
