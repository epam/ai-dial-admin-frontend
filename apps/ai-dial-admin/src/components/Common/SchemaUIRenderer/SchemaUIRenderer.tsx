import { FC, useCallback } from 'react';

import { IChangeEvent } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import { SchemaForm } from '@/src/components/Common/SchemaUIRenderer/CustomTemplates/CustomSchemaForm';

interface Props {
  schema: RJSFSchema;
  data?: Record<string, unknown>;
  onChangeConfiguration: (data: Record<string, unknown>) => void;
}
const SchemaUiRenderer: FC<Props> = ({ schema, data, onChangeConfiguration }) => {
  const onChange = useCallback(
    (data: IChangeEvent<any, RJSFSchema, any>) => {
      onChangeConfiguration(data.formData);
    },
    [onChangeConfiguration],
  );
  const formData = data;

  return (
    <SchemaForm schema={schema} validator={validator} formData={formData} onChange={onChange}>
      <></>
    </SchemaForm>
  );
};

export default SchemaUiRenderer;
