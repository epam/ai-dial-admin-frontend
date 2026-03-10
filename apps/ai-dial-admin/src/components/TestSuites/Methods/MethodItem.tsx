'use client';

import { FC, useCallback } from 'react';

import classNames from 'classnames';

import { TestSuiteEndpointRef } from '@/src/models/evaluation/test-suite';
import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

interface Props {
  index: number;
  item: TestSuiteEndpointRef;
  isActive: boolean;
  onClick: (index: number) => void;
}

const MethodItem: FC<Props> = ({ index, item, isActive, onClick }) => {
  const onMethodClick = useCallback(() => {
    onClick(index);
  }, [onClick, index]);

  return (
    <div
      className={classNames(
        'flex flex-row gap-x-3 items-center h-8 px-3 rounded border-l-2 border-transparent hover:bg-accent-primary-alpha cursor-pointer',
        isActive && 'bg-accent-primary-alpha border-l-accent-primary',
      )}
      onClick={onMethodClick}
    >
      <span className="tiny bg-layer-3 rounded p-1 border border-primary whitespace-nowrap max-w-[200px] overflow-hidden">
        {item.method}
      </span>
      <DialEllipsisTooltip text={item.relativeUrlPattern} />
    </div>
  );
};

export default MethodItem;
