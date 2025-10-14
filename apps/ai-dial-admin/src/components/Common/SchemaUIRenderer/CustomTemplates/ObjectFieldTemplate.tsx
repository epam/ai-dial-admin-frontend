import { FC } from 'react';

import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';
import { canExpand, ObjectFieldTemplateProps } from '@rjsf/utils';
import { IconPlus } from '@tabler/icons-react';

import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

export const ObjectFieldTemplate: FC<ObjectFieldTemplateProps> = (props) => {
  const { title, properties, schema, uiSchema, formData, onAddClick } = props;

  return (
    <fieldset className="bg-layer-0 p-6">
      {title && <p className="small">{title}</p>}
      <div className="space-y-3">
        {properties.map((prop) => (
          <div key={prop.name}>{prop.content}</div>
        ))}
      </div>
      {canExpand(schema, uiSchema, formData) && (
        <DialButton
          variant={ButtonVariant.Tertiary}
          onClick={onAddClick(schema)}
          title={`Add ${title}`}
          cssClass="w-fit mt-2"
          iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
        />
      )}
    </fieldset>
  );
};
