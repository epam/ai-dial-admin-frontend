import { FC } from 'react';

import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { canExpand, ObjectFieldTemplateProps } from '@rjsf/utils';
import { IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { WidgetHeader } from '@/src/components/Common/SchemaUIRenderer/Components/WidgetHeader';
import { WidgetToggler } from '@/src/components/Common/SchemaUIRenderer/Components/WidgetToggler';

export const ObjectFieldTemplate: FC<ObjectFieldTemplateProps> = (props) => {
  const { title, properties, schema, uiSchema, formData, readonly, onAddProperty } = props;
  const t = useI18n();
  const isRoot = schema.isRoot;

  return (schema?.additionalProperties as any)?.oneOf ? null : (
    <WidgetToggler title={title} isRoot={isRoot}>
      <fieldset className={classNames('w-full', isRoot ? 'bg-layer-0' : 'bg-layer-1 pl-6 py-6')}>
        {title && <WidgetHeader title={title} defaultHeader={true} caption={schema.description} />}
        <div className="space-y-3">
          {properties.map((prop) => (
            <div key={prop.name}>{prop.content}</div>
          ))}
        </div>

        {canExpand(schema, uiSchema, formData) && !readonly && (
          <DialGhostButton
            onClick={onAddProperty}
            label={t(ButtonsI18nKey.AddAdditionalProperties)}
            className="w-fit mt-2"
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
          />
        )}
      </fieldset>
    </WidgetToggler>
  );
};
