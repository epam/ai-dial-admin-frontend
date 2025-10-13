import { FC } from 'react';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema } from '@rjsf/utils';
import { SchemaForm } from '@/src/components/Common/SchemaUIRenderer/CustomTemplates/CustomSchemaForm';

interface Props {
  schema: RJSFSchema;
}

const SchemaUiRenderer: FC<Props> = ({ schema }) => {
  return (
    <SchemaForm schema={schema} validator={validator}>
      <></>
    </SchemaForm>
  );
};

export default SchemaUiRenderer;
