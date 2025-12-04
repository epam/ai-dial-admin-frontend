import { FC, useCallback, useEffect, useState } from 'react';

import { DialSwitch, DialTextInputField } from '@epam/ai-dial-ui-kit';

import FilePath from '@/src/components/Common/FilePath/FilePath';
import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import MdEditor from '@/src/components/Common/MdEditor/MdEditor';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import VersionControl from '@/src/components/EntityMainProperties/BaseProperties/Version';
import { BasicI18nKey, EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { usePromptFolder } from '@/src/context/assets/PromptFolderContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Publication } from '@/src/models/dial/publications';
import { JSONEditorError } from '@/src/types/editor';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

interface Props {
  prompt: DialPrompt;
  onChangePrompt?: (key: DialPrompt) => void;
  isImmutable?: boolean;
  publication?: Publication;
}

const PromptProperties: FC<Props> = ({ prompt, onChangePrompt, isImmutable, publication }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const [isJSONContentMode, setIsJSONContentMode] = useState(false);
  const [jsonValue, setJsonValue] = useState<string | undefined>(undefined);

  const onChangeContent = useCallback(
    (content: string) => {
      onChangePrompt?.({ ...prompt, content });
    },
    [prompt, onChangePrompt],
  );

  const onChangePath = useCallback(
    (folderId: string) => {
      onChangePrompt?.({ ...prompt, folderId });
    },
    [prompt, onChangePrompt],
  );

  const onChangeContentMode = useCallback(
    (value: boolean) => {
      setIsJSONContentMode(value);
      if (!value) {
        dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
      }
    },
    [dispatch],
  );

  const onChangeJsonValue = useCallback(
    (v: string | undefined) => {
      setJsonValue(v);
      onChangePrompt?.({ ...prompt, content: v as string });
    },
    [onChangePrompt, prompt],
  );

  const onValidateJSON = useCallback(
    (errors?: JSONEditorError[]) => {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors: errors || [] });
    },
    [dispatch],
  );

  useEffect(() => {
    try {
      const parsed = JSON.parse(prompt.content);

      if (typeof parsed === 'object') {
        setJsonValue(JSON.stringify(parsed, null, 2));
      }
      setJsonValue(prompt.content);
    } catch {
      setJsonValue(prompt.content);
    }
  }, [isJSONContentMode, prompt.content]);

  return (
    <div className="h-full flex flex-col w-full">
      <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary">
        {publication ? (
          <>
            <LabelledText label={t(EntityFieldsI18nKey.displayName)} text={prompt.name} copyable={true} />
            {prompt.author && <LabelledText label={t(EntitiesI18nKey.Author)} text={prompt.author} />}
            <LabelledText
              label={t(EntityFieldsI18nKey.createdAt)}
              text={formatDateTimeToLocalString(publication.createdAt)}
            />
          </>
        ) : (
          <>
            <LabelledText label={t(EntityFieldsI18nKey.displayName)} text={prompt.name} copyable={true} />
            {prompt.author && <LabelledText label={t(EntitiesI18nKey.Author)} text={prompt.author} />}
            <LabelledText
              label={t(EntityFieldsI18nKey.updatedAt)}
              text={formatDateTimeToLocalString(prompt.updatedAt)}
            />
          </>
        )}
      </div>

      <div>
        <div className="flex flex-col gap-y-8 pr-6 mt-8">
          {isImmutable && (
            <div className="flex items-end gap-4 w-[105px]">
              <VersionControl version={prompt.version} disabled={isImmutable} />
            </div>
          )}
          <div className="lg:w-[35%]">
            <DescriptionControl entity={prompt} onChangeEntity={onChangePrompt} disabled={isImmutable} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <div className="tiny mb-2 text-secondary">{t(EntityFieldsI18nKey.content)}</div>
              <DialSwitch
                isOn={isJSONContentMode}
                title="JSON"
                switchId="content_json_mode"
                onChange={onChangeContentMode}
              />
            </div>
            {isJSONContentMode ? (
              <div className="h-[300px] border border-primary rounded">
                <JsonEditorBase value={jsonValue} onChange={onChangeJsonValue} onValidateJSON={onValidateJSON} />
              </div>
            ) : (
              <MdEditor content={prompt.content} onChangeContent={onChangeContent} />
            )}
          </div>
          <div className="lg:w-[35%]">
            {isImmutable ? (
              <DialTextInputField
                elementId="version"
                fieldTitle={t(EntitiesI18nKey.FolderStorage)}
                value={prompt.path}
                disabled={isImmutable}
              />
            ) : (
              <FilePath
                value={prompt.folderId}
                label={t(EntitiesI18nKey.FolderStorage)}
                modalTitle={t(BasicI18nKey.MoveToFolder)}
                placeholder={t(EntityPlaceholdersI18nKey.Path)}
                onChange={onChangePath}
                context={usePromptFolder as () => AssetsFolderContext<DialPrompt | DialFile>}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptProperties;
