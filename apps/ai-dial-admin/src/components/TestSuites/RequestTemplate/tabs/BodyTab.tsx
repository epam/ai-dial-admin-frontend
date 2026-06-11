'use client';

import { Dispatch, forwardRef, SetStateAction, useCallback, useImperativeHandle, useMemo, useRef } from 'react';

import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { ContentType } from '@/src/components/TestSuites/constants/content-type';
import FormDataGrid, { FormDataGridRef } from '@/src/components/TestSuites/RequestTemplate/components/FormDataGrid';
import { TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';
import { FormDataPart } from '@/src/models/form-data';

export interface BodyTabRef {
  add: () => void;
}

interface Props {
  selectedTestSuiteId: string;
  template: TestSuiteRequestTemplate;
  changeTemplate: (template: TestSuiteRequestTemplate) => void;
}

const BodyTab = forwardRef<BodyTabRef, Props>(({ selectedTestSuiteId, template, changeTemplate }, ref) => {
  const isJsonContent = useMemo(() => template.body?.contentType === ContentType.JSON, [template.body?.contentType]);
  const formDataGridRef = useRef<FormDataGridRef>(null);

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

  useImperativeHandle(
    ref,
    () => ({
      add: () => {
        if (!isJsonContent) formDataGridRef.current?.add();
      },
    }),
    [isJsonContent],
  );

  return (
    <div className="w-full h-[350px]">
      {isJsonContent ? (
        <JsonEditor
          entity={(template.body?.content || {}) as Record<string, unknown>}
          setSelectedEntity={onChangeJson as Dispatch<SetStateAction<Record<string, unknown>>>}
          options={{ stickyScroll: { enabled: false } }}
        />
      ) : (
        <FormDataGrid
          ref={formDataGridRef}
          selectedTestSuiteId={selectedTestSuiteId}
          content={(template.body?.content as FormDataPart[]) || []}
          changeContent={(content) => onChangeFormData(content)}
          hideAddButton
        />
      )}
    </div>
  );
});

BodyTab.displayName = 'BodyTab';

export default BodyTab;
