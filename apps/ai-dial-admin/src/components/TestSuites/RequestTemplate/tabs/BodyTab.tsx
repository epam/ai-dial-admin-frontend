'use client';

import { Dispatch, forwardRef, SetStateAction, useCallback, useImperativeHandle, useMemo, useRef } from 'react';

import JsonataEditor from '@/src/components/Common/JsonataEditor/JsonataEditor';
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
  bodyText: string;
  onChangeBodyText: (text: string) => void;
  changeTemplate: (template: TestSuiteRequestTemplate) => void;
}

const BodyTab = forwardRef<BodyTabRef, Props>(
  ({ selectedTestSuiteId, template, bodyText, onChangeBodyText, changeTemplate }, ref) => {
    const isJsonataContent = template.body?.jsonataContent != null;
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

    const onChangeJsonata = useCallback(
      (jsonataContent: string) => {
        const { content: __content, ...restBody } = template.body ?? {};

        onChangeBodyText(jsonataContent);
        changeTemplate({
          ...template,
          body: {
            ...restBody,
            jsonataContent,
          },
        });
      },
      [changeTemplate, onChangeBodyText, template],
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
          if (!isJsonContent && !isJsonataContent) formDataGridRef.current?.add();
        },
      }),
      [isJsonContent, isJsonataContent],
    );

    return (
      <div className="w-full h-[350px]">
        {isJsonataContent ? (
          <JsonataEditor value={bodyText} onChange={onChangeJsonata} options={{ stickyScroll: { enabled: false } }} />
        ) : isJsonContent ? (
          <JsonEditor
            entity={(template.body?.content || {}) as Record<string, unknown>}
            setSelectedEntity={onChangeJson as Dispatch<SetStateAction<Record<string, unknown>>>}
            text={bodyText}
            onChangeText={onChangeBodyText}
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
  },
);

BodyTab.displayName = 'BodyTab';

export default BodyTab;
