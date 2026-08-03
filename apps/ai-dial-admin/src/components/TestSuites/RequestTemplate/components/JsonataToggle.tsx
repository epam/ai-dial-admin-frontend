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
import { TestSuite, TestSuiteRequestTemplateBody } from '@/src/models/evaluation/test-suite';
import { useJsonataExpressionStash } from './use-jsonata-expression-stash';

interface Props {
  testSuite: TestSuite;
  onChangeTestSuite: (testSuite: TestSuite) => void;
}

const JsonataToggle: FC<Props> = ({ testSuite, onChangeTestSuite }) => {
  const t = useI18n();
  const { stashExpression, takeStashedExpression } = useJsonataExpressionStash();
  const body = testSuite.requestTemplate?.body;
  const isOn = body?.jsonataContent != null;

  const onChange = useCallback(
    (value: boolean) => {
      const { content, jsonataContent, ...restBody } = body ?? {};
      let nextBody: TestSuiteRequestTemplateBody;

      if (value) {
        // Turn-on leaves `contentType` untouched — normalizing it here would be a hidden
        // side effect on a field the user did not touch (design D1a).
        nextBody = {
          ...restBody,
          jsonataContent: takeStashedExpression(content) ?? getJsonataExpressionForContent(content),
        };
      } else {
        // Turn-off must hand the body to an editor that can actually render it. An absent
        // `contentType` falls through BodyTab to FormDataGrid, but ContentTypeSelect has been
        // *displaying* `application/json` for that case all along — so normalize it here to
        // match, rather than defaulting only `content` and leaving `contentType` absent.
        const nextContent = getContentForJsonataExpression(jsonataContent, restBody.contentType);
        stashExpression(jsonataContent, nextContent);
        nextBody = {
          ...restBody,
          contentType: restBody.contentType ?? ContentType.JSON,
          content: nextContent,
        };
      }

      onChangeTestSuite({
        ...testSuite,
        requestTemplate: { ...testSuite.requestTemplate, body: nextBody },
      });
    },
    [body, onChangeTestSuite, stashExpression, takeStashedExpression, testSuite],
  );

  return <DialSwitch switchId="jsonataToggle" label={t(JsonAtaI18nKey.ToggleLabel)} isOn={isOn} onChange={onChange} />;
};

export default JsonataToggle;
