import { FC } from 'react';

import { DialInput, DialRemoveButton } from '@epam/ai-dial-ui-kit';
import { ADDITIONAL_PROPERTY_FLAG, WrapIfAdditionalTemplateProps } from '@rjsf/utils';

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
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return <div className="w-full">{children}</div>;
  }
  return (
    <div className={classNames} style={style}>
      <div className="flex flex-row gap-4">
        <div className="flex">
          <DialInput
            containerClassName="flex w-full bg-layer-2"
            elementId={id}
            disabled={disabled}
            readonly={readonly}
            onBlur={({ target }) => onKeyChange(target.value)}
            defaultValue={label}
          />
        </div>
        <div className="bg-layer-2">{children}</div>
        {!readonly && (
          <DialRemoveButton
            onClick={onDropPropertyClick(label)}
            iconClassName="text-error"
            className="border rounded border-primary justify-start p-2"
          />
        )}
      </div>
    </div>
  );
};
