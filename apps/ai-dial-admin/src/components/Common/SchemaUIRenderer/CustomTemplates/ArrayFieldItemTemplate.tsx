import { FC } from 'react';

import { DialRemoveButton } from '@epam/ai-dial-ui-kit';
import type { ArrayFieldItemTemplateProps } from '@rjsf/utils';
import classNames from 'classnames';

import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';

export const ArrayFieldItemTemplate: FC<ArrayFieldItemTemplateProps> = ({
  children,
  buttonsProps,
  schema,
  itemKey,
}) => {
  const { hasRemove, readonly, onRemoveItem } = buttonsProps;
  const isString = schema.type === 'string';
  return (
    <li key={itemKey} className={classNames('flex w-full gap-3 items-start', isString && STANDARD_CONTROL_WIDTH)}>
      {children}
      {hasRemove && !readonly && <DialRemoveButton onClick={onRemoveItem} />}
    </li>
  );
};
