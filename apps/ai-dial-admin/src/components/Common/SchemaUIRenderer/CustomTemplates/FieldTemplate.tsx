import { FC } from 'react';

import type { FieldTemplateProps } from '@rjsf/utils';

import { WrapIfAdditionalTemplate } from './WrapIfAdditionalTemplate';

export const FieldTemplate: FC<FieldTemplateProps> = (props) => {
  return (
    <WrapIfAdditionalTemplate {...props}>
      {props.children}
      {props.errors}
      {props.help}
    </WrapIfAdditionalTemplate>
  );
};
