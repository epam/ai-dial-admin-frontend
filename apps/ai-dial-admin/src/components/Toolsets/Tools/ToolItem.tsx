'use client';

import { FC } from 'react';

interface Props {
  tool: string;
}

const ToolItem: FC<Props> = ({ tool }) => {
  return (
    <div className="p-3 mb-2 border border-primary rounded flex flex-row items-center justify-between">
      <span>{tool}</span>
    </div>
  );
};

export default ToolItem;
