'use client';

import { Dispatch, FC, SetStateAction, useCallback } from 'react';

import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';

import { TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';

interface Props {
  template: TestSuiteRequestTemplate;
  changeTemplate: (template: TestSuiteRequestTemplate) => void;
}

const BodyTab: FC<Props> = ({ template, changeTemplate }) => {
  const onChangeBody = useCallback(
    (body: Record<string, unknown>) => {
      changeTemplate({
        ...template,
        body,
      });
    },
    [changeTemplate, template],
  );

  return (
    <JsonEditor
      entity={template.body || {}}
      setSelectedEntity={onChangeBody as Dispatch<SetStateAction<Record<string, unknown>>>}
      options={{ stickyScroll: { enabled: false } }}
    />
  );
};

export default BodyTab;
