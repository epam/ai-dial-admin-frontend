'use client';

import { FC, useCallback } from 'react';

import { DialSwitch } from '@epam/ai-dial-ui-kit';

import { ContentType } from '@/src/components/TestSuites/constants/content-type';
import {
  getContentForJsonataExpression,
  getJsonataExpressionForContent,
} from '@/src/components/TestSuites/utils/body-content';
import { JsonAtaI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  testSuite: TestSuite;
  onChangeTestSuite: (testSuite: TestSuite) => void;
}

const JsonataToggle: FC<Props> = ({ testSuite, onChangeTestSuite }) => {
  const t = useI18n();
  const body = testSuite.requestTemplate?.body;
  const isOn = body?.jsonataContent != null;

  const onChange = useCallback(
    (value: boolean) => {
      const { content, jsonataContent, ...restBody } = body ?? {};

      onChangeTestSuite({
        ...testSuite,
        requestTemplate: {
          ...testSuite.requestTemplate,
          body: value
            ? // Turn-on leaves `contentType` untouched — normalizing it here would be a hidden
              // side effect on a field the user did not touch (design D1a).
              { ...restBody, jsonataContent: getJsonataExpressionForContent(content) }
            : // Turn-off must hand the body to an editor that can actually render it. An absent
              // `contentType` falls through BodyTab to FormDataGrid, but ContentTypeSelect has been
              // *displaying* `application/json` for that case all along — so normalize it here to
              // match, rather than defaulting only `content` and leaving `contentType` absent.
              {
                ...restBody,
                contentType: restBody.contentType ?? ContentType.JSON,
                content: getContentForJsonataExpression(jsonataContent, restBody.contentType),
              },
        },
      });
    },
    [body, onChangeTestSuite, testSuite],
  );

  return <DialSwitch switchId="jsonataToggle" label={t(JsonAtaI18nKey.ToggleLabel)} isOn={isOn} onChange={onChange} />;
};

export default JsonataToggle;
