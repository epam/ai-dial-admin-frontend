import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react';
import { DialPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import { getPrompt } from '@/src/app/[lang]/prompts/actions';
import DiffField from '@/src/components/Common/DiffField/DiffField';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { BasicI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialPrompt } from '@/src/models/dial/prompt';
import VersionsControl from './VersionsControl';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';

interface Props {
  heading: string;
  isModalOpen: boolean;
  onClose: () => void;
  prompts?: DialPrompt[];
  prompt: DialPrompt;
}

const CompareVersions: FC<Props> = ({ heading, isModalOpen, onClose, prompts, prompt }) => {
  const t = useI18n();
  const versions = prompts?.map((prompt) => prompt.version) as string[];

  const [original, setOriginal] = useState<DialPrompt | null>(null);
  const [modified, setModified] = useState<DialPrompt | null>(prompt);

  const fetchPrompt = useCallback(async (prompt: DialPrompt) => {
    const { path } = prompt;
    return (await getPrompt(path, DEFAULT_ETAG))?.response;
  }, []);

  const onChange = useCallback(
    async (version: string, cb: Dispatch<SetStateAction<DialPrompt | null>>) => {
      const prompt = prompts?.find((prompt) => prompt.version === version);
      if (prompt) {
        const data = await fetchPrompt(prompt);
        cb(data as SetStateAction<DialPrompt | null>);
      } else {
        cb(null);
      }
    },
    [fetchPrompt, prompts],
  );

  useEffect(() => {
    const toCompare = prompts?.reverse().find((p) => p.version !== prompt.version);

    fetchPrompt(toCompare as DialPrompt).then((data) => setOriginal(data as DialPrompt | null));
  }, [prompts, prompt, fetchPrompt]);

  return (
    <DialPopup
      open={isModalOpen}
      portalId="compareVersionsModal"
      className="h-[93%]"
      size={PopupSize.Lg}
      header={heading}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 px-6 py-4 h-full relative">
        <div className="flex flex-row gap-x-6">
          <div className="flex-1">
            <VersionsControl
              versions={versions}
              version={original?.version as string}
              setVersion={(version) => onChange(version, setOriginal)}
            />
          </div>
          <div className="flex-1">
            <VersionsControl
              versions={versions}
              version={modified?.version as string}
              setVersion={(version) => onChange(version, setModified)}
            />
          </div>
        </div>

        {(original?.author || modified?.author) && (
          <LabelledText label={t(EntityFieldsI18nKey.author)}>
            <div className="flex">
              <p className="flex-1 body text-primary">{original?.author || t(BasicI18nKey.None)}</p>
              <p className="flex-1 body text-primary">{modified?.author || t(BasicI18nKey.None)}</p>
            </div>
          </LabelledText>
        )}

        <DiffField
          label={t(EntityFieldsI18nKey.description)}
          original={original?.description}
          modified={modified?.description}
          className="max-h-[200px]"
        />
        <DiffField label={t(EntityFieldsI18nKey.content)} original={original?.content} modified={modified?.content} />
      </div>
    </DialPopup>
  );
};

export default CompareVersions;
