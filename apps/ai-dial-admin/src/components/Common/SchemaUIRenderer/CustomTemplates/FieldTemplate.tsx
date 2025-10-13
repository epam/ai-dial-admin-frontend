import { FC } from 'react';
import type { FieldTemplateProps } from '@rjsf/utils';

export const FieldTemplate: FC<FieldTemplateProps> = ({ id, children, errors, help, schema }) => {
  const isString = schema.type === 'string';

  return (
    <div id={id} className={isString ? 'w-full' : ''}>
      {children}
      {errors}
      {help}
    </div>
  );
};
