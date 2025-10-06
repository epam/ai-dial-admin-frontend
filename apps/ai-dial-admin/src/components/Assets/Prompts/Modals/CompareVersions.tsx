import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react';

import classNames from 'classnames';

import { getPrompt } from '@/src/app/[lang]/prompts/actions';
import DiffField from '@/src/components/Common/DiffField/DiffField';
import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import Popup from '@/src/components/Common/Popup/Popup';
import { BasicI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialPrompt } from '@/src/models/dial/prompt';
import { PopUpState } from '@/src/types/pop-up';
import VersionsControl from './VersionsControl';

interface Props {
  heading: string;
  modalState: PopUpState;
  onClose: () => void;
  prompts?: DialPrompt[];
  prompt: DialPrompt;
}

const CompareVersions: FC<Props> = ({ heading, modalState, onClose, prompts, prompt }) => {
  const t = useI18n();
  const containerClassName = classNames('h-[93%] min-w-[92%]');
  const versions = prompts?.map((prompt) => prompt.version) as string[];

  const [original, setOriginal] = useState<DialPrompt | null>(null);
  const [modified, setModified] = useState<DialPrompt | null>(prompt);

  const fetchPrompt = useCallback(async (prompt: DialPrompt) => {
    const { version, folderId, name } = prompt;
    return await getPrompt(folderId, name as string, version);
  }, []);

  const onChange = useCallback(
    async (version: string, cb: Dispatch<SetStateAction<DialPrompt | null>>) => {
      const prompt = prompts?.find((prompt) => prompt.version === version);
      if (prompt) {
        const data = await fetchPrompt(prompt);
        cb(data);
      } else {
        cb(null);
      }
    },
    [fetchPrompt, prompts],
  );

  useEffect(() => {
    const toCompare = prompts?.reverse().find((p) => p.version !== prompt.version);

    fetchPrompt(toCompare as DialPrompt).then((data) => setOriginal(data));
  }, [prompts, prompt, fetchPrompt]);

  return (
    <Popup
      portalId="compareVersionsModal"
      containerClassName={containerClassName}
      state={modalState}
      heading={heading}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 px-6 py-4 h-full">
        <div className="flex flex-row">
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
          <LabeledText label={t(EntityFieldsI18nKey.author)}>
            <div className="flex">
              <p className="flex-1 body text-primary">{original?.author || t(BasicI18nKey.None)}</p>
              <p className="flex-1 body text-primary">{modified?.author || t(BasicI18nKey.None)}</p>
            </div>
          </LabeledText>
        )}

        <DiffField
          fieldTitle={t(EntityFieldsI18nKey.description)}
          original={original?.description}
          modified={modified?.description}
          cssClass={'max-h-[200px]'}
        />
        <DiffField
          fieldTitle={t(EntityFieldsI18nKey.content)}
          original={original?.content}
          modified={modified?.content}
        />
      </div>
      <></>
    </Popup>
  );
};

export default CompareVersions;
