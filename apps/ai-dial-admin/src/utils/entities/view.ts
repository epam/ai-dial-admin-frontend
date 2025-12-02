import classNames from 'classnames';

export const getViewHeaderClassName = (isJsonEditorEnabled?: boolean) => {
  return classNames('flex flex-row min-h-[34px] mb-8', isJsonEditorEnabled ? 'justify-end' : 'justify-between');
};
