'use client';

import { FC, useCallback } from 'react';

import { DialSchemaRenderer, JsonSchema } from '@epam/ai-dial-ui-kit';
import { EditorThemes } from '@epam/ai-dial-ui-kit/dist/src/types/editor';

import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useTheme } from '@/src/context/ThemeContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';

interface Props {
  schema: JsonSchema;
  data?: Record<string, unknown>;
  onChangeConfiguration: (value: Record<string, unknown>) => void;
  onGetSchemeDefaults?: (value: Record<string, unknown>) => void;
  disabled?: boolean;
  defaultExpanded?: boolean;
  acceptableResourceTypes?: Record<string, unknown>;
}
const SchemaUiRenderer: FC<Props> = ({
  schema,
  data,
  onChangeConfiguration,
  onGetSchemeDefaults,
  disabled,
  defaultExpanded = true,
  acceptableResourceTypes,
}) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { currentTheme } = useTheme();
  const isReadonly = disabled || isReadOnlyAdmin;
  const onChange = useCallback(
    (value: Record<string, unknown>) => {
      onChangeConfiguration(value);
    },
    [onChangeConfiguration],
  );

  return (
    <DialSchemaRenderer
      schema={schema}
      onChange={onChange}
      defaultValue={data}
      onDefaultValues={onGetSchemeDefaults}
      readonly={isReadonly}
      inputClassName={STANDARD_CONTROL_WIDTH}
      defaultExpanded={defaultExpanded}
      acceptableResourceTypes={acceptableResourceTypes}
      jsonEditorTheme={currentTheme as EditorThemes}
    />
  );
};

export default SchemaUiRenderer;
