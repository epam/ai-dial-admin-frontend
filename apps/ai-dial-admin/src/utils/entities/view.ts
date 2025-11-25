import classNames from 'classnames';

export const getViewHeaderClassNames = (jsonEditorEnabled?: boolean) => {
  return classNames('flex flex-row min-h-[34px] mb-8', jsonEditorEnabled ? 'justify-end' : 'justify-between');
};
