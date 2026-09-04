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
  /** Readable URL shown instead of `item.relativeUrlPattern`, which may be a regex. */
  label?: string;
}

const MethodItem: FC<Props> = ({ index, item, isActive, onClick, label }) => {
  const onMethodClick = useCallback(() => {
    onClick(index);
  }, [onClick, index]);

  return (
    <button
      type="button"
      aria-current={isActive}
      className={classNames(
        'flex flex-row gap-x-3 items-center h-8 px-3 rounded border-l-2 border-transparent text-left w-full hover:bg-accent-primary-alpha focus-visible:bg-accent-primary-alpha cursor-pointer',
        isActive && 'bg-accent-primary-alpha border-l-accent-primary',
      )}
      onClick={onMethodClick}
    >
      <span className="tiny bg-layer-3 rounded p-1 border border-primary whitespace-nowrap max-w-[200px] overflow-hidden">
        {item.method}
      </span>{' '}
      <DialEllipsisTooltip text={label ?? item.relativeUrlPattern} />
    </button>
  );
};

export default MethodItem;
