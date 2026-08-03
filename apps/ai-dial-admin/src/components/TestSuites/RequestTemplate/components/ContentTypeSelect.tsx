'use client';

import { FC, useCallback, useState } from 'react';

import { DialSelect, SelectSize, SelectVariant } from '@epam/ai-dial-ui-kit';

import { contentTypes } from '@/src/components/TestSuites/constants/content-type';
import { BodyContent, getDefaultContentForType } from '@/src/components/TestSuites/utils/body-content';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';

type TempContentMap = Record<string, BodyContent>;

interface Props {
  testSuite: TestSuite;
  onChangeTestSuite: (testSuite: TestSuite) => void;
}

const ContentTypeSelect: FC<Props> = ({ testSuite, onChangeTestSuite }) => {
  const t = useI18n();
  const [tempContent, setTempContent] = useState<TempContentMap>({});

  const currentContentType = testSuite.requestTemplate?.body?.contentType ?? contentTypes[0].value;

  const handleChange = useCallback(
    (type: string | string[]) => {
      const newContentType = (Array.isArray(type) ? type[0] : type) as string;
      if (newContentType === currentContentType) return;

      const currentContent: BodyContent =
        testSuite.requestTemplate?.body?.content ?? getDefaultContentForType(currentContentType);

      const nextMap: TempContentMap = {
        ...tempContent,
        [currentContentType]: currentContent,
      };
      setTempContent(nextMap);

      const contentForNewType: BodyContent = nextMap[newContentType] ?? getDefaultContentForType(newContentType);
      const { jsonataContent: __jsonataContent, ...restBody } = testSuite.requestTemplate?.body ?? {};

      onChangeTestSuite({
        ...testSuite,
        requestTemplate: {
          ...testSuite.requestTemplate,
          body: {
            ...restBody,
            contentType: newContentType,
            content: contentForNewType,
          },
        },
      });
    },
    [currentContentType, onChangeTestSuite, testSuite, tempContent],
  );

  return (
    <DialSelect
      prefix={`${t(BasicI18nKey.ContentType)}: `}
      size={SelectSize.Sm}
      variant={SelectVariant.Secondary}
      options={contentTypes}
      value={currentContentType}
      onChange={handleChange}
    />
  );
};

export default ContentTypeSelect;
