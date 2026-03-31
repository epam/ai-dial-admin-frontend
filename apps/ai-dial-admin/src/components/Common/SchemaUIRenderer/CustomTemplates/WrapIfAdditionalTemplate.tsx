import { FC, useState } from 'react';

import { DialInput, DialRemoveButton } from '@epam/ai-dial-ui-kit';
import { ADDITIONAL_PROPERTY_FLAG, WrapIfAdditionalTemplateProps } from '@rjsf/utils';

export const WrapIfAdditionalTemplate: FC<WrapIfAdditionalTemplateProps> = ({
  id,
  label,
  children,
  classNames,
  style,
  schema,
  disabled,
  readonly,
  onRemoveProperty,
  onKeyRename,
}) => {
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return <div className="w-full">{children}</div>;
  }
  const [keyValue, setKeyValue] = useState(label);

  return (
    <div className={classNames} style={style}>
      <div className="flex flex-row gap-4">
        <div className="flex">
          <DialInput
            containerClassName="flex w-full bg-layer-2"
            id={id}
            disabled={disabled || readonly}
            onBlur={({ target }) => onKeyRename(target.value)}
            value={keyValue}
            onChange={(v) => setKeyValue(v || '')}
          />
        </div>
        <div className="bg-layer-2">{children}</div>
        {!readonly && <DialRemoveButton onClick={onRemoveProperty} />}
      </div>
    </div>
  );
};
