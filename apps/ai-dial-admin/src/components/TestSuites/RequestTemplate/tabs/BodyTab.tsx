'use client';

import { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';

import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { ContentType } from '@/src/components/TestSuites/constants/content-type';
import FormDataGrid from '@/src/components/TestSuites/RequestTemplate/components/FormDataGrid';
import { TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';
import { FormDataPart } from '@/src/models/form-data';

interface Props {
  template: TestSuiteRequestTemplate;
  changeTemplate: (template: TestSuiteRequestTemplate) => void;
}

const BodyTab: FC<Props> = ({ template, changeTemplate }) => {
  const isJsonContent = useMemo(() => template.body?.contentType === ContentType.JSON, [template.body?.contentType]);

  const onChangeJson = useCallback(
    (content: Record<string, unknown>) => {
      changeTemplate({
        ...template,
        body: {
          ...template.body,
          content,
        },
      });
    },
    [changeTemplate, template],
  );

  const onChangeFormData = useCallback(
    (content: FormDataPart[]) => {
      changeTemplate({
        ...template,
        body: {
          ...template.body,
          content,
        },
      });
    },
    [changeTemplate, template],
  );

  return isJsonContent ? (
    <JsonEditor
      entity={(template.body?.content || {}) as Record<string, unknown>}
      setSelectedEntity={onChangeJson as Dispatch<SetStateAction<Record<string, unknown>>>}
      options={{ stickyScroll: { enabled: false } }}
    />
  ) : (
    <FormDataGrid
      content={(template.body?.content as FormDataPart[]) || []}
      changeContent={(content) => onChangeFormData(content)}
    />
  );
};

export default BodyTab;
