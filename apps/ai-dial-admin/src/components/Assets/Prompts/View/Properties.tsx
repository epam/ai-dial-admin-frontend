import { FC, useCallback, useEffect, useState } from 'react';

import { DialSwitch } from '@epam/ai-dial-ui-kit';

import DescriptionControl from '@/src/components/BaseControls/Description';
import VersionControl from '@/src/components/BaseControls/Version';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import MdEditor from '@/src/components/Common/MdEditor/MdEditor';
import { BasicI18nKey, EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { usePromptFolder } from '@/src/context/assets/PromptFolderContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialPrompt } from '@/src/models/dial/prompt';
import { JSONEditorError } from '@/src/types/editor';

interface Props {
  prompt: DialPrompt;
  onChangePrompt?: (key: DialPrompt) => void;
  isPublication?: boolean;
}

const PromptProperties: FC<Props> = ({ prompt, onChangePrompt, isPublication }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { dispatch } = useSaveValidationContext();

  const [isJSONContentMode, setIsJSONContentMode] = useState(false);
  const [jsonValue, setJsonValue] = useState<string | undefined>(undefined);

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
    <div className="flex flex-col gap-y-8">
      {isPublication && (
        <VersionControl
          containerClassName="w-[175px]"
          version={prompt.version}
          onChange={(version?: string) => onChangePrompt?.({ ...prompt, version: version || '' })}
        />
      )}
      <DescriptionControl entity={prompt} onChangeEntity={onChangePrompt} isFullWidth={false} />
      <div>
        <div className="flex justify-between mb-2">
          <div className="tiny mb-2 text-secondary">{t(EntityFieldsI18nKey.content)}</div>
          {!isReadOnlyAdmin && (
            <DialSwitch
              isOn={isJSONContentMode}
              label="JSON"
              switchId="content_json_mode"
              onChange={onChangeContentMode}
            />
          )}
        </div>
        {isJSONContentMode ? (
          <div className="h-[300px] border border-primary rounded">
            <JsonEditorBase
              value={jsonValue}
              onChange={onChangeJsonValue}
              onValidateJSON={onValidateJSON}
              options={isReadOnlyAdmin ? { readOnly: true } : undefined}
            />
          </div>
        ) : (
          <MdEditor
            content={prompt.content}
            onChangeContent={
              isReadOnlyAdmin ? undefined : (content: string) => onChangePrompt?.({ ...prompt, content })
            }
            readOnly={isReadOnlyAdmin}
          />
        )}
      </div>
      {!isPublication && (
        <FilePath
          value={prompt.folderId}
          label={t(EntitiesI18nKey.FolderStorage)}
          modalTitle={t(BasicI18nKey.MoveToFolder)}
          placeholder={t(EntityPlaceholdersI18nKey.Path)}
          onChange={(folderId: string) => onChangePrompt?.({ ...prompt, folderId })}
          context={usePromptFolder}
          disabled={isReadOnlyAdmin}
        />
      )}
    </div>
  );
};

export default PromptProperties;
