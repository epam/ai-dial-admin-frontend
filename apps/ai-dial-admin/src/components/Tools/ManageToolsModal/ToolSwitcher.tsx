'use client';

import { FC, useCallback } from 'react';

import { DialSwitch } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

interface Props {
  index: number;
  isCustomTool: boolean;
  toolName: string;
  isOn: boolean;
  isActive: boolean;
  onClick: (index: number, isCustom: boolean) => void;
  onSwitch: (index: number, isCustom: boolean) => void;
}

const ToolSwitcher: FC<Props> = ({ index, isCustomTool, toolName, isActive, isOn, onClick, onSwitch }) => {
  const onToolClick = useCallback(() => {
    onClick(index, isCustomTool);
  }, [onClick, index, isCustomTool]);

  const onToolSwitch = useCallback(() => {
    onSwitch(index, isCustomTool);
  }, [onSwitch, index, isCustomTool]);

  return (
    <div
      className={classNames(
        'rounded flex flex-row flex-1 justify-between h-[38px] items-center px-3 border-l-2 border-transparent hover:bg-accent-primary-alpha mt-1',
        isActive ? 'bg-accent-primary-alpha border-l-accent-primary' : '',
      )}
      onClick={onToolClick}
    >
      <span className="truncate text-primary dial-small">{toolName}</span>
      <DialSwitch
        switchId={`${index}-${isCustomTool ? 'custom-tool' : 'tool'}-${toolName}`}
        isOn={isOn}
        onChange={onToolSwitch}
      />
    </div>
  );
};

export default ToolSwitcher;
