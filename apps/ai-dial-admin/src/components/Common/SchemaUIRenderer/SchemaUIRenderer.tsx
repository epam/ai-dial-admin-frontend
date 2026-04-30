'use client';

import { FC, useCallback } from 'react';

import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { DialSchemeRenderer, JsonSchema } from '@epam/ai-dial-ui-kit';

interface Props {
  schema: JsonSchema;
  data?: Record<string, unknown>;
  onChangeConfiguration: (value: Record<string, unknown>) => void;
  onGetSchemeDefaults?: (value: Record<string, unknown>) => void;
  disabled?: boolean;
  defaultExpanded?: boolean;
}
const SchemaUiRenderer: FC<Props> = ({
  schema,
  data,
  onChangeConfiguration,
  onGetSchemeDefaults,
  disabled,
  defaultExpanded = true,
}) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isReadonly = disabled || isReadOnlyAdmin;
  const onChange = useCallback(
    (value: Record<string, unknown>) => {
      onChangeConfiguration(value);
    },
    [onChangeConfiguration],
  );

  return (
    <DialSchemeRenderer
      schema={schema}
      onChange={onChange}
      defaultValue={data}
      onDefaultValues={onGetSchemeDefaults}
      readonly={isReadonly}
      inputClassName={STANDARD_CONTROL_WIDTH}
      defaultExpanded={defaultExpanded}
    />
  );
};

export default SchemaUiRenderer;
