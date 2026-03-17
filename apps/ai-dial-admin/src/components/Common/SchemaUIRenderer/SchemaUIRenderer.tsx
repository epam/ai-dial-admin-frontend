'use client';

import { createRef, FC, useCallback, useEffect } from 'react';

import Form, { IChangeEvent } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import { SchemaForm } from '@/src/components/Common/SchemaUIRenderer/CustomTemplates/CustomSchemaForm';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { DefaultsValue } from '@/src/models/dial/defaults';

interface Props {
  schema: RJSFSchema;
  data?: Record<string, unknown>;
  onChangeConfiguration: (data: Record<string, DefaultsValue>) => void;
  onGetSchemeDefaults?: (data: Record<string, DefaultsValue>) => void;
  readonly?: boolean;
}
const SchemaUiRenderer: FC<Props> = ({ schema, data, onChangeConfiguration, onGetSchemeDefaults, readonly }) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isReadonly = readonly || isReadOnlyAdmin;
  const onChange = useCallback(
    (data: IChangeEvent<any, RJSFSchema, any>) => {
      onChangeConfiguration(data.formData);
    },
    [onChangeConfiguration],
  );
  const onSubmit = (data: IChangeEvent<any, RJSFSchema, any>) => onGetSchemeDefaults?.(data.formData);

  const formRef = createRef<Form>();
  useEffect(() => {
    formRef.current?.submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <SchemaForm
      ref={formRef}
      schema={schema}
      validator={validator}
      formData={data}
      onChange={onChange}
      onSubmit={onSubmit}
      showErrorList={false}
      readonly={isReadonly}
      noValidate={true}
    >
      <></>
    </SchemaForm>
  );
};

export default SchemaUiRenderer;
