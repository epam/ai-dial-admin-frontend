import classNames from 'classnames';

import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';

// TODO: remove after change entity header
export const getViewHeaderClassName = (isJsonEditorEnabled?: boolean) => {
  return classNames('flex flex-row min-h-[34px] mb-8 gap-x-4', isJsonEditorEnabled ? 'justify-end' : 'justify-between');
};

export const getHeaderClassName = (isJsonEditorEnabled?: boolean) => {
  return classNames('flex flex-row min-h-[34px] gap-x-4', isJsonEditorEnabled ? 'justify-end' : 'justify-between');
};

export const getControlClassName = (isFullWidth?: boolean) => {
  return isFullWidth ? 'w-full' : STANDARD_CONTROL_WIDTH;
};
