import { FC } from 'react';

import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';
import { canExpand, ObjectFieldTemplateProps } from '@rjsf/utils';
import { IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { WidgetHeader } from '@/src/components/Common/SchemaUIRenderer/Components/WidgetHeader';
import { WidgetToggler } from '@/src/components/Common/SchemaUIRenderer/Components/WidgetToggler';

export const ObjectFieldTemplate: FC<ObjectFieldTemplateProps> = (props) => {
  const { title, properties, schema, uiSchema, formData, onAddClick, readonly } = props;
  const t = useI18n()
  const isRoot = schema['dial:applicationTypeDisplayName'];

  return (schema?.additionalProperties as any)?.oneOf ? null : (
    <WidgetToggler title={title} isRoot={isRoot}>
      <fieldset className={classNames('py-6 pl-6 w-full', isRoot ? 'bg-layer-0 pr-6' : 'bg-layer-1')}>
        {title && <WidgetHeader title={title} defaultHeader={true} description={schema.description} />}
        <div className="space-y-3">
          {properties.map((prop) => (
            <div key={prop.name}>{prop.content}</div>
          ))}
        </div>

        {canExpand(schema, uiSchema, formData) && !readonly && (
          <DialButton
            variant={ButtonVariant.Tertiary}
            onClick={onAddClick(schema)}
            label={t(ButtonsI18nKey.AddAdditionalProperties)}
            className="w-fit mt-2"
            iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
          />
        )}
      </fieldset>
    </WidgetToggler>
  );
};
