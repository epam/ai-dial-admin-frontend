import { FC } from 'react';

import { DialInput, DialRemoveButton } from '@epam/ai-dial-ui-kit';
import { ADDITIONAL_PROPERTY_FLAG, WrapIfAdditionalTemplateProps } from '@rjsf/utils';

import { useI18n } from '@/src/locales/client';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';

export const WrapIfAdditionalTemplate: FC<WrapIfAdditionalTemplateProps> = ({
  id,
  label,
  onKeyChange,
  children,
  classNames,
  style,
  schema,
  disabled,
  readonly,
  onDropPropertyClick,
}) => {
  const t = useI18n();
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return <div className="w-full">{children}</div>;
  }
  return (
    <div className={classNames} style={style}>
      <div className="flex flex-row gap-4">
        <div className="flex">
          <DialInput
            containerCssClass={'flex w-full bg-layer-2'}
            elementId={id}
            disabled={disabled}
            readonly={readonly}
            onBlur={({ target }) => onKeyChange(target.value)}
            defaultValue={t(EntityFieldsI18nKey.new_key)}
          />
        </div>
        <div className="bg-layer-2">{children}</div>
        <DialRemoveButton
          onClick={onDropPropertyClick(label)}
          iconClass="text-error"
          cssClass="border rounded border-primary justify-start p-2"
        />
      </div>
    </div>
  );
};
