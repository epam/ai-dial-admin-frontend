'use client';
import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';

import { DialLoader, DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, ExportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { getModelsTopics } from '@/src/app/[lang]/models/actions';

interface Props {
  selectedTopics: string[];
  setSelectedTopics: Dispatch<SetStateAction<string[]>>;
}

const ExportTopics: FC<Props> = ({ selectedTopics, setSelectedTopics }) => {
  const t = useI18n();
  const [items, setItems] = useState<SelectOption[] | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!items) {
      setIsLoading(true);
      getModelsTopics().then((res) => {
        setIsLoading(false);
        if (res.success) {
          const items = (res.response as string[]) || [];
          setItems(items.map((item) => ({ label: item, value: item })));
        } else {
          setItems([]);
        }
      });
    }
  }, [setItems, items]);

  return isLoading ? (
    <DialLoader />
  ) : (
    <DialSelectField
      listClassName="w-[200px]"
      captionDescription={t(ExportI18nKey.TopicsCaption)}
      id="topics"
      label={t(EntityFieldsI18nKey.topics)}
      multiple
      onChange={(topics) => {
        setSelectedTopics(topics as string[]);
      }}
      options={items || []}
      placeholder={t(ExportI18nKey.TopicsPlaceholder)}
      searchable
      value={selectedTopics}
    />
  );
};

export default ExportTopics;
