import classNames from 'classnames';

export const getViewHeaderClassNames = (jsonEditorEnabled?: boolean) => {
  return classNames('flex flex-row min-h-[34px]', jsonEditorEnabled ? 'justify-end' : 'justify-between');
};
