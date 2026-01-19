import { withTheme } from '@rjsf/core';

import AnyOfField from './AnyOfField';
import { ArrayFieldItemTemplate } from './ArrayFieldItemTemplate';
import { ArrayFieldTemplate } from './ArrayFieldTemplate';
import { CheckboxWidget } from './CheckboxWidget';
import { FieldTemplate } from './FieldTemplate';
import { ObjectFieldTemplate } from './ObjectFieldTemplate';
import { PasswordWidget } from './PasswordWidget';
import { SelectWidget } from './SelectWidget';
import { TextWidget } from './TextWidget';
import { TitleTemplate } from './TitleTemplate';
import { URLWidget } from './UrlWidget';
import { WrapIfAdditionalTemplate } from './WrapIfAdditionalTemplate';

export const Theme = {
  templates: {
    TitleTemplate,
    ObjectFieldTemplate,
    ArrayFieldTemplate,
    FieldTemplate,
    WrapIfAdditionalTemplate,
    ArrayFieldItemTemplate,
  },
  widgets: { TextWidget, URLWidget, SelectWidget, CheckboxWidget, PasswordWidget },
  fields: { AnyOfField, OneOfField: AnyOfField },
};

export const SchemaForm = withTheme(Theme);
