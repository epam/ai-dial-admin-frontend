import classNames from 'classnames';

import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';

export const getHeaderClassName = (isJsonEditorEnabled?: boolean) => {
  return classNames('flex flex-row min-h-[34px] gap-x-4', isJsonEditorEnabled ? 'justify-end' : 'justify-between');
};

export const getControlClassName = (isFullWidth?: boolean) => {
  return isFullWidth ? 'w-full' : STANDARD_CONTROL_WIDTH;
};
