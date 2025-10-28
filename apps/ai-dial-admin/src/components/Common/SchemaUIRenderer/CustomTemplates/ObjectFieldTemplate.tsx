import { FC } from 'react';

import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';
import { canExpand, ObjectFieldTemplateProps } from '@rjsf/utils';
import { IconPlus } from '@tabler/icons-react';

import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

export const ObjectFieldTemplate: FC<ObjectFieldTemplateProps> = (props) => {
  const { title, properties, schema, uiSchema, formData, onAddClick, readonly } = props;
  const t = useI18n() as (stringToTranslate: string) => string;

  return (
    <fieldset className="p-6">
      {title && <p className="small mb-2">{title}</p>}
      <div className="space-y-3">
        {properties.map((prop) => (
          <div key={prop.name}>{prop.content}</div>
        ))}
      </div>
      {canExpand(schema, uiSchema, formData) && !readonly && (
        <DialButton
          variant={ButtonVariant.Tertiary}
          onClick={onAddClick(schema)}
          title={t(ButtonsI18nKey.AddAdditionalProperties)}
          cssClass="w-fit mt-2"
          iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
        />
      )}
    </fieldset>
  );
};
