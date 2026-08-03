'use client';

import { FC, useCallback } from 'react';

import { DialSwitch } from '@epam/ai-dial-ui-kit';

import { ContentType } from '@/src/components/TestSuites/constants/content-type';
import { getContentForJsonataExpression } from '@/src/components/TestSuites/utils/body-content';
import { JsonAtaI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite, TestSuiteRequestTemplateBody } from '@/src/models/evaluation/test-suite';

interface Props {
  testSuite: TestSuite;
  bodyText: string;
  onChangeTestSuite: (testSuite: TestSuite) => void;
}

const JsonataToggle: FC<Props> = ({ testSuite, bodyText, onChangeTestSuite }) => {
  const t = useI18n();
  const body = testSuite.requestTemplate?.body;
  const isOn = body?.jsonataContent != null;

  const onChange = useCallback(
    (value: boolean) => {
      const { content: __content, jsonataContent: __jsonataContent, ...restBody } = body ?? {};
      let nextBody: TestSuiteRequestTemplateBody;

      if (value) {
        nextBody = { ...restBody, jsonataContent: bodyText };
      } else {
        nextBody = {
          ...restBody,
          contentType: restBody.contentType ?? ContentType.JSON,
          content: getContentForJsonataExpression(bodyText, restBody.contentType),
        };
      }

      onChangeTestSuite({
        ...testSuite,
        requestTemplate: { ...testSuite.requestTemplate, body: nextBody },
      });
    },
    [body, bodyText, onChangeTestSuite, testSuite],
  );

  return <DialSwitch switchId="jsonataToggle" label={t(JsonAtaI18nKey.ToggleLabel)} isOn={isOn} onChange={onChange} />;
};

export default JsonataToggle;
