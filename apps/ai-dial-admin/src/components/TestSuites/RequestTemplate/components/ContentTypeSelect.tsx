'use client';

import { FC, useCallback, useState } from 'react';

import { DialSelect, SelectSize, SelectVariant } from '@epam/ai-dial-ui-kit';

import { ContentType, contentTypes } from '@/src/components/TestSuites/constants/content-type';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { FormDataPart } from '@/src/models/form-data';

type BodyContent = Record<string, unknown> | FormDataPart[];
type TempContentMap = Record<string, BodyContent>;
const getDefaultContentForType = (contentType: string): BodyContent => (contentType === ContentType.FormData ? [] : {});

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

      onChangeTestSuite({
        ...testSuite,
        requestTemplate: {
          ...testSuite.requestTemplate,
          body: {
            ...testSuite.requestTemplate?.body,
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
