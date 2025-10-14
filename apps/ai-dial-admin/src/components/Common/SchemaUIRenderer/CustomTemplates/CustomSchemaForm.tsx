import { withTheme } from '@rjsf/core';

import { ArrayFieldTemplate } from '@/src/components/Common/SchemaUIRenderer/CustomTemplates/ArrayFieldTeplate';
import { ObjectFieldTemplate } from '@/src/components/Common/SchemaUIRenderer/CustomTemplates/ObjectFieldTemplate';
import { FieldTemplate } from './FieldTemplate';
import { TextWidget } from './TextWidget';
import { TitleTemplate } from './TitleTemplate';
import { WrapIfAdditionalTemplate } from './WrapIfAdditionalTemplate';

export const Theme = {
  templates: {
    TitleTemplate,
    ObjectFieldTemplate,
    ArrayFieldTemplate,
    FieldTemplate,
    WrapIfAdditionalTemplate,
  },
  widgets: { TextWidget },
};

export const SchemaForm = withTheme(Theme);
