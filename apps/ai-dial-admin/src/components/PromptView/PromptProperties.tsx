import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { IconPlus } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

import AddVersionModal from '@/src/components/Common/AddVersionModal/AddVersionModal';
import Button from '@/src/components/Common/Button/Button';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import MdEditor from '@/src/components/Common/MdEditor/MdEditor';
import Switch from '@/src/components/Common/Switch/Switch';
import TextAreaField from '@/src/components/Common/TextAreaField/TextAreaField';
import { BasicI18nKey, ButtonsI18nKey, CreateI18nKey, PromptsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { usePromptFolder } from '@/src/context/PromptFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Publication } from '@/src/models/dial/publications';
import { FieldError } from '@/src/models/error';
import { JSONEditorError } from '@/src/types/editor';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { modifyNameVersionInPrompt } from '@/src/utils/prompts/versions';
import { getErrorForDescription } from '@/src/utils/validation/description-error';

interface Props {
  prompt: DialPrompt;
  prompts?: DialPrompt[];
  onChangePrompt?: (key: DialPrompt) => void;
  getPrompt?: (folderId: string, name: string, version: string) => Promise<DialPrompt | null>;
  isImmutable?: boolean;
  publication?: Publication;
  addedVersions: string[];
  setAddedVersions: Dispatch<SetStateAction<string[]>>;
  setContentJsonErrors: Dispatch<SetStateAction<JSONEditorError[]>>;
  setSelectedPrompt: Dispatch<SetStateAction<DialPrompt>>;
}

const PromptProperties: FC<Props> = ({
  prompt,
  prompts,
  onChangePrompt,
  getPrompt,
  isImmutable,
  publication,
  addedVersions,
  setAddedVersions,
  setContentJsonErrors,
  setSelectedPrompt,
}) => {
  const t = useI18n() as (t: string) => string;
  const router = useRouter();

  const versions: string[] = prompts?.map((prompt) => prompt.version) || [];
  const [modalState, setModalState] = useState(PopUpState.Closed);

  const [descriptionError, setDescriptionError] = useState<FieldError | null>(null);
  const [isJSONContentMode, setJSONContentMode] = useState(false);
  const [jsonValue, setJsonValue] = useState<string | undefined>(undefined);

  const onChangeDescription = useCallback(
    (description: string) => {
      setDescriptionError(getErrorForDescription(description, t));
      onChangePrompt?.({ ...prompt, description });
    },
    [prompt, onChangePrompt, t],
  );

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

  const onChangeVersion = useCallback(
    async (version: string) => {
      const found = await getPrompt?.(prompt.folderId as string, prompt.name as string, version);
      if (found) {
        setSelectedPrompt({} as DialPrompt);
        router.push(
          `${ApplicationRoute.Prompts}/${`${encodeURIComponent((found as DialPrompt).name as string)}?path=${encodeURIComponent((found as DialPrompt).path)}`}`,
        );
      } else {
        const path = modifyNameVersionInPrompt(prompt.path, void 0, version);
        onChangePrompt?.({
          ...prompt,
          version,
          path,
        });
      }
    },
    [getPrompt, prompt, setSelectedPrompt, router, onChangePrompt],
  );

  const onOpenModal = useCallback(() => {
    setModalState(PopUpState.Opened);
  }, [setModalState]);

  const onCloseModal = useCallback(() => {
    setModalState(PopUpState.Closed);
  }, [setModalState]);

  const onAddVersion = useCallback(
    (version: string) => {
      setAddedVersions((prev) => [...new Set([...prev, version])]);
      onChangeVersion(version);
      setModalState(PopUpState.Closed);
    },
    [onChangeVersion, setAddedVersions],
  );

  const onChangeContentMode = useCallback(
    (value: boolean) => {
      setJSONContentMode(value);
      if (!value) {
        setContentJsonErrors([]);
      }
    },
    [setContentJsonErrors],
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
      setContentJsonErrors(errors || []);
    },
    [setContentJsonErrors],
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
    <div className="h-full flex flex-col pt-3 divide-y divide-primary w-full">
      <div className="flex flex-row gap-10">
        {/* will be uncommented after BE implement author */}
        {publication ? (
          <>
            {/* <LabeledText label="Author" text={publication.author} /> */}
            <LabeledText label="Create Time" text={formatDateTimeToLocalString(publication.createdAt)} />
          </>
        ) : (
          <>
            {/* <LabeledText label="Author" text={prompt.author} /> */}
            <LabeledText label="Update Time" text={formatDateTimeToLocalString(prompt.updateTime)} />
          </>
        )}
      </div>

      <div className="mt-8 pt-8">
        <div className="flex flex-col gap-6">
          <div className="lg:w-[35%]">
            <TextInputField
              elementId="name"
              fieldTitle={t(CreateI18nKey.NameTitle)}
              placeholder={t(CreateI18nKey.NamePlaceholder)}
              value={prompt.name}
              disabled={true}
              iconAfterInput={<CopyButton field={prompt.name} />}
            />
          </div>
          <div className="w-[105px]">
            {isImmutable ? (
              <TextInputField
                elementId="version"
                fieldTitle={t(CreateI18nKey.VersionTitle)}
                value={prompt.version}
                disabled={isImmutable}
              />
            ) : (
              <DropdownField
                elementCssClass="lg:w-[35%]"
                selectedValue={prompt.version}
                elementId="version"
                items={[...new Set([...versions, ...addedVersions])].map((v) => ({ id: v, name: v }))}
                fieldTitle={t(CreateI18nKey.VersionTitle)}
                onChange={onChangeVersion}
              >
                <Button
                  cssClass="tertiary w-full"
                  iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
                  title={t(ButtonsI18nKey.Create)}
                  onClick={onOpenModal}
                />
              </DropdownField>
            )}
          </div>
          <TextAreaField
            elementId="description"
            elementCssClass="lg:w-[35%]"
            fieldTitle={t(CreateI18nKey.DescriptionTitle)}
            placeholder={t(CreateI18nKey.DescriptionPlaceholder)}
            optional={true}
            disabled={isImmutable}
            value={prompt.description}
            errorText={descriptionError?.text}
            invalid={!!descriptionError}
            onChange={onChangeDescription}
          />
          <div>
            <div className="flex justify-between mb-2">
              <div className="tiny mb-2 text-secondary">{t(CreateI18nKey.ContentTitle)}</div>
              <Switch
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
              <TextInputField
                elementId="version"
                fieldTitle={t(CreateI18nKey.StoragePathTitle)}
                value={prompt.path}
                disabled={isImmutable}
              />
            ) : (
              <FilePath
                value={prompt.folderId}
                label={t(CreateI18nKey.StoragePathTitle)}
                modalTitle={t(BasicI18nKey.MoveToFolder)}
                placeholder={t(CreateI18nKey.StoragePathPlaceholder)}
                onChange={onChangePath}
                context={usePromptFolder}
              />
            )}
          </div>
        </div>
      </div>
      {modalState === PopUpState.Opened &&
        createPortal(
          <AddVersionModal
            heading={t(PromptsI18nKey.NewVersionCreate)}
            modalState={modalState}
            existingVersions={[...versions, ...addedVersions]}
            onClose={onCloseModal}
            onConfirm={onAddVersion}
          />,
          document.body,
        )}
    </div>
  );
};

export default PromptProperties;
