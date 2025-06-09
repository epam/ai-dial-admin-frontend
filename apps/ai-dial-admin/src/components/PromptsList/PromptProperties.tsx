import { Dispatch, FC, SetStateAction, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconPlus } from '@tabler/icons-react';

import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { formatTimestampToDate } from '@/src/utils/formatting/date';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { BasicI18nKey, ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import TextAreaField from '@/src/components/Common/TextAreaField/TextAreaField';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import Button from '@/src/components/Common/Button/Button';
import { PopUpState } from '@/src/types/pop-up';
import AddVersionModal from '@/src/components/Common/AddVersionModal/AddVersionModal';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Publication } from '@/src/models/dial/publications';
import { FieldError } from '@/src/models/error';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import { usePromptFolder } from '@/src/context/PromptFolderContext';
import ReactMarkdown from 'react-markdown';
import ReactMde from 'react-mde';
import 'react-mde/lib/styles/css/react-mde-all.css';
import Switch from '@/src/components/Common/Switch/Switch';

interface Props {
  prompt: DialPrompt;
  prompts?: DialPrompt[];
  onChangePrompt?: (key: DialPrompt) => void;
  getPrompt?: (folderId: string, name: string, version: string) => Promise<DialPrompt | null>;
  isImmutable?: boolean;
  publication?: Publication;
  addedVersions: string[];
  setAddedVersions: Dispatch<SetStateAction<string[]>>;
}

enum SelectedContentView {
  WRITE = 'write',
  PREVIEW = 'preview',
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
}) => {
  const t = useI18n() as (t: string) => string;
  const versions: DropdownItemsModel[] | undefined = prompts?.map((prompt) => ({
    id: prompt.version,
    name: prompt.version,
  }));
  const [modalState, setModalState] = useState(PopUpState.Closed);

  const [descriptionError, setDescriptionError] = useState<FieldError | null>(null);
  const [selectedTab, setSelectedTab] = useState(SelectedContentView.WRITE);
  const [isJSONContentMode, setJSONContentMode] = useState(false);

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
        onChangePrompt?.({
          ...prompt,
          description: found.description,
          content: found.content,
          folderId: found.folderId,
          version,
        });
      } else {
        onChangePrompt?.({
          ...prompt,
          version,
        });
      }
    },
    [prompt, getPrompt, onChangePrompt],
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

  return (
    <div className="h-full flex flex-col pt-3 divide-y divide-primary w-full">
      <div className="flex flex-row gap-10">
        {/* will be uncommented after BE implement author */}
        {publication ? (
          <>
            {/* <LabeledText label="Author" text={publication.author} /> */}
            <LabeledText label="Created At" text={formatTimestampToDate(publication.createdAt)} />
          </>
        ) : (
          <>
            {/* <LabeledText label="Author" text={prompt.author} /> */}
            <LabeledText label="Update Time" text={formatTimestampToDate(prompt.updateTime)} />
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
                items={[...(versions || []), ...addedVersions.map((v) => ({ id: v, name: v }))]}
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
                onChange={(value) => setJSONContentMode(value)}
              />
            </div>
            {isJSONContentMode ? (
              <TextAreaField
                elementId="content"
                placeholder={t(CreateI18nKey.ContentPlaceholder)}
                value={prompt.content}
                onChange={onChangeContent}
                elementCssClass="resize-y w-full min-h-[300px]"
                disabled={isImmutable}
              />
            ) : (
              <ReactMde
                value={prompt.content}
                onChange={onChangeContent}
                selectedTab={selectedTab}
                onTabChange={(tab) => setSelectedTab(tab as SelectedContentView)}
                generateMarkdownPreview={(markdown: string) =>
                  Promise.resolve(<ReactMarkdown>{markdown}</ReactMarkdown>)
                }
              />
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
            modalState={modalState}
            existingVersions={[...(versions || []).map((v) => v.id), ...addedVersions]}
            onClose={onCloseModal}
            onConfirm={onAddVersion}
          />,
          document.body,
        )}
    </div>
  );
};

export default PromptProperties;
