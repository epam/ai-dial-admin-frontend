import { withTheme } from '@rjsf/core';
import { TitleTemplate } from './TitleTemplate';
import { TextWidget } from './TextWidget';
import { ObjectFieldTemplate } from '@/src/components/Common/SchemaUIRenderer/CustomTemplates/ObjectFieldTemplate';
import { ArrayFieldTemplate } from '@/src/components/Common/SchemaUIRenderer/CustomTemplates/ArrayFieldTeplate';
import { FieldTemplate } from '@/src/components/Common/SchemaUIRenderer/CustomTemplates/FieldTemplate';

export const Theme = {
  templates: {
    TitleTemplate,
    ObjectFieldTemplate,
    ArrayFieldTemplate,
    FieldTemplate,
  },
  widgets: { TextWidget },
};

export const SchemaForm = withTheme(Theme);
