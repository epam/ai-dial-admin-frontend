import { useRouter } from 'next/navigation';
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { IconPlus, IconReplace } from '@tabler/icons-react';
import { DialSwitch, ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import MdEditor from '@/src/components/Common/MdEditor/MdEditor';
import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import VersionControl from '@/src/components/EntityMainProperties/BaseProperties/Version';
import {
  BasicI18nKey,
  ButtonsI18nKey,
  CompareI18nKey,
  EntitiesI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  FoldersI18nKey,
  PromptsI18nKey,
} from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { usePromptFolder } from '@/src/context/assets/PromptFolderContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Publication } from '@/src/models/dial/publications';
import { JSONEditorError } from '@/src/types/editor';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { modifyNameVersionInPrompt } from '@/src/utils/prompts/versions';
import AddVersionModal from '../Modals/AddVersionModal';
import CompareVersions from '../Modals/CompareVersions';

interface Props {
  prompt: DialPrompt;
  prompts?: DialPrompt[];
  onChangePrompt?: (key: DialPrompt) => void;
  getPrompt?: (folderId: string, name: string, version: string) => Promise<DialPrompt | null>;
  isImmutable?: boolean;
  publication?: Publication;
  addedVersions: string[];
  setAddedVersions: Dispatch<SetStateAction<string[]>>;
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
  setSelectedPrompt,
}) => {
  const t = useI18n() as (t: string) => string;
  const router = useRouter();
  const { dispatch } = useSaveValidationContext();

  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [modalType, setModalType] = useState<ModalType>();

  const [isJSONContentMode, setIsJSONContentMode] = useState(false);
  const [jsonValue, setJsonValue] = useState<string | undefined>(undefined);

  const versions = useMemo(() => {
    return prompts?.map((prompt) => prompt.version) || [];
  }, [prompts]);

  const items = useMemo(() => {
    return [...new Set([...versions, ...addedVersions])].map((v) => ({ id: v, name: v }));
  }, [addedVersions, versions]);

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
      const found = await getPrompt?.(prompt.folderId, prompt.name as string, version);
      if (found) {
        setSelectedPrompt({} as DialPrompt);
        router.push(
          `${ApplicationRoute.Prompts}/${`${encodeURIComponent((found as DialPrompt).name as string)}?path=${encodeURIComponent(found.path)}`}`,
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

  const handleModalClose = useCallback(() => {
    setModalState(PopUpState.Closed);
    setModalType(void 0);
  }, []);

  const handleModalOpen = useCallback((modalType: ModalType) => {
    setModalType(modalType);
    setModalState(PopUpState.Opened);
  }, []);

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
    <div className="h-full flex flex-col pt-3 divide-y divide-primary w-full">
      <div className="flex flex-row gap-10 mb-6">
        {publication ? (
          <>
            <LabeledText label={t(EntityFieldsI18nKey.displayName)} text={prompt.name} copyButton={true} />
            {prompt.author && <LabeledText label={t(EntitiesI18nKey.Author)} text={prompt.author} />}
            <LabeledText
              label={t(EntityFieldsI18nKey.createdAt)}
              text={formatDateTimeToLocalString(publication.createdAt)}
            />
          </>
        ) : (
          <>
            <LabeledText label={t(EntityFieldsI18nKey.displayName)} text={prompt.name} copyButton={true} />
            {prompt.author && <LabeledText label={t(EntitiesI18nKey.Author)} text={prompt.author} />}
            <LabeledText
              label={t(EntityFieldsI18nKey.updatedAt)}
              text={formatDateTimeToLocalString(prompt.updateTime)}
            />
          </>
        )}
      </div>

      <div className="pt-6">
        <div className="flex flex-col gap-6 pr-6">
          <div className="flex items-end gap-4">
            <div className="w-[105px]">
              {isImmutable ? (
                <VersionControl version={prompt.version} disabled={isImmutable} />
              ) : (
                <DropdownField
                  elementCssClass="lg:w-[35%]"
                  selectedValue={prompt.version}
                  elementId="version"
                  items={items}
                  fieldTitle={t(EntityFieldsI18nKey.displayVersion)}
                  onChange={onChangeVersion}
                >
                  <DialButton
                    cssClass="w-full"
                    variant={ButtonVariant.Tertiary}
                    iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
                    title={t(ButtonsI18nKey.Create)}
                    onClick={() => handleModalOpen(ModalType.addVersion)}
                  />
                </DropdownField>
              )}
            </div>
            {!!prompts?.length && prompts.length > 1 && (
              <DialButton
                variant={ButtonVariant.Secondary}
                iconBefore={<IconReplace {...BASE_ICON_PROPS} />}
                title={t(CompareI18nKey.CompareVersions)}
                onClick={() => handleModalOpen(ModalType.compareVersions)}
              />
            )}
          </div>
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
              <TextInputField
                elementId="version"
                fieldTitle={t(FoldersI18nKey.Storage)}
                value={prompt.path}
                disabled={isImmutable}
              />
            ) : (
              <FilePath
                value={prompt.folderId}
                label={t(FoldersI18nKey.Storage)}
                modalTitle={t(BasicI18nKey.MoveToFolder)}
                placeholder={t(EntityPlaceholdersI18nKey.Path)}
                onChange={onChangePath}
                context={usePromptFolder as () => AssetsFolderContext<DialPrompt | DialFile>}
              />
            )}
          </div>
        </div>
      </div>
      {modalState === PopUpState.Opened &&
        modalType === ModalType.addVersion &&
        createPortal(
          <AddVersionModal
            heading={t(PromptsI18nKey.NewVersionCreate)}
            modalState={modalState}
            existingVersions={[...versions, ...addedVersions]}
            onClose={handleModalClose}
            onConfirm={onAddVersion}
          />,
          document.body,
        )}
      {modalState === PopUpState.Opened &&
        modalType === ModalType.compareVersions &&
        createPortal(
          <CompareVersions
            heading={t(CompareI18nKey.CompareVersions)}
            modalState={modalState}
            onClose={handleModalClose}
            prompts={prompts}
            prompt={prompt}
          />,
          document.body,
        )}
    </div>
  );
};

export default PromptProperties;
