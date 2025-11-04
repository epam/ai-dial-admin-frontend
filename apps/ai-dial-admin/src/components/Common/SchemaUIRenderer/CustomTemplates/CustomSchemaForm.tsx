import { withTheme } from '@rjsf/core';

import { ArrayFieldTemplate } from '@/src/components/Common/SchemaUIRenderer/CustomTemplates/ArrayFieldTeplate';
import { ObjectFieldTemplate } from '@/src/components/Common/SchemaUIRenderer/CustomTemplates/ObjectFieldTemplate';
import AnyOfField from './AnyOfField';
import { CheckboxWidget } from './CheckboxWidget';
import { FieldTemplate } from './FieldTemplate';
import { PasswordWidget } from './PasswordWidget';
import { TextWidget } from './TextWidget';
import { TitleTemplate } from './TitleTemplate';
import { URLWidget } from './UrlWidget';
import { WrapIfAdditionalTemplate } from './WrapIfAdditionalTemplate';
import { SelectWidget } from './SelectWidget';

export const Theme = {
  templates: {
    TitleTemplate,
    ObjectFieldTemplate,
    ArrayFieldTemplate,
    FieldTemplate,
    WrapIfAdditionalTemplate,
  },
  widgets: { TextWidget, URLWidget, SelectWidget, CheckboxWidget, PasswordWidget },
  fields: { AnyOfField, OneOfField: AnyOfField },
};

export const SchemaForm = withTheme(Theme);
