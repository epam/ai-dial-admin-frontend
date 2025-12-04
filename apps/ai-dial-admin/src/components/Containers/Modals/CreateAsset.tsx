import { FC, useEffect, useMemo, useState } from 'react';
import { debounce } from 'lodash';
import {
  ButtonVariant,
  DialButton,
  DialCollapsibleSidebar,
  DialPopup,
  DialTextAreaField,
  DialTextInputField,
} from '@epam/ai-dial-ui-kit';
import { Asset, AssetToolset } from '@/src/models/dial/deployment-asset';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { CONTAINER_TRANSPORT } from '@/src/types/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { getAssetTemplate, splitFolderId } from '@/src/utils/deployments/entity';
import { FieldError } from '@/src/models/error';
import { getToolsets } from '@/src/app/actions/deployments';
import { addTrailingSlash } from '@/src/utils/url';
import { getVersionControlError } from '@/src/utils/validation/version-error';
import { getSemanticVersionError } from '@/src/utils/deployments/validation';
import { getErrorForDisplayName, getErrorForName } from '@/src/utils/validation/name-error';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import FolderList from '@/src/components/Common/FolderList/FolderList';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { DialFile } from '@/src/models/dial/file';
import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { getVersionsPerName } from '@/src/components/Assets/utils';

interface Props {
  isModalOpen: boolean;
  modalTitle: string;
  onClose: () => void;
  onCreate: (entity: AssetToolset) => void;
  container: Container;
  route: ApplicationRoute;
  names?: string[];
  transport?: CONTAINER_TRANSPORT;
}

const CreateAsset: FC<Props> = ({ onClose, isModalOpen, modalTitle, names, onCreate, container, route, transport }) => {
  const t = useI18n();
  const folderContext = useToolsetFolder();
  const [entity, setEntity] = useState<AssetToolset>(getAssetTemplate(route, container, t, transport) as AssetToolset);
  const [versionsMap, setVersionsMap] = useState<Record<string, string[]>>({});
  const [versionError, setVersionError] = useState<FieldError | null>(null);
  const [displayNameError, setDisplayNameError] = useState<FieldError | null>(null);
  const [nameError, setNameError] = useState<FieldError | null>(null);
  const [descriptionError, setDescriptionError] = useState<FieldError | null>(null);

  const fetchData = useMemo(
    () =>
      debounce((folderId: string) => {
        getToolsets(addTrailingSlash(folderId)).then((data) => {
          if (data && data.length > 0) {
            setVersionsMap(getVersionsPerName(data as Asset[]));
          } else {
            setVersionsMap({});
          }
        });
      }, 500),
    [],
  );

  useEffect(() => {
    if (entity.folderId) {
      fetchData(entity.folderId);
    }
  }, [entity.folderId, fetchData, folderContext]);

  useEffect(() => {
    const versionError =
      getVersionControlError(entity.version, false, false, t) ||
      getSemanticVersionError(versionsMap, entity, t, entity.version);
    setVersionError(versionError);
    setNameError(getErrorForName(entity.name, names, t));
    setDisplayNameError(getErrorForDisplayName(entity.displayName, true, t));
    setDescriptionError(getErrorForDescription(entity.description, t));
  }, [entity, names, t, versionsMap]);

  useEffect(() => {
    setEntity((prevEntity) => ({
      ...prevEntity,
      folderId: folderContext.filePath,
    }));
  }, [folderContext.filePath]);

  return (
    <DialPopup
      onClose={onClose}
      title={modalTitle}
      portalId="CreateEntityModal"
      open={isModalOpen}
      className="flex flex-col lg:max-w-[75%] md:max-w-[75%] lg:max-h-[80%] md:max-h-[80%] h-full"
    >
      <div className="flex flex-1 min-h-0 p-4 gap-4">
        <DialCollapsibleSidebar
          width={320}
          title=""
          containerClassName="bg-layer-3 mr-0 border border-primary"
          iconSize={24}
        >
          <FolderList context={useToolsetFolder as () => AssetsFolderContext<AssetToolset | DialFile>} view={route} />
        </DialCollapsibleSidebar>
        <div className="flex flex-col h-full overflow-auto p-4 gap-6 flex-1 bg-layer-2 max-h-full">
          <h3>{t(EntityFieldsI18nKey.properties)}</h3>
          <DialTextInputField
            textBeforeInput={splitFolderId(entity.folderId).base}
            elementId="path"
            fieldTitle={t(EntityFieldsI18nKey.StorageFolder)}
            value={splitFolderId(entity.folderId).path}
            onChange={(folderPath?: string) => {
              setEntity({
                ...entity,
                folderId: `${splitFolderId(entity.folderId).base}${folderPath}`,
              });
            }}
          />
          <DialTextInputField
            elementId="id"
            fieldTitle={t(EntityFieldsI18nKey.id)}
            placeholder={t(EntityPlaceholdersI18nKey.Id)}
            value={entity.name}
            errorText={nameError?.text}
            invalid={!!nameError}
            onChange={(name?: string) => {
              setEntity({
                ...entity,
                name,
              });
            }}
          />
          <DialTextInputField
            elementId="displayName"
            fieldTitle={t(EntityFieldsI18nKey.displayName)}
            placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
            value={entity.displayName}
            errorText={displayNameError?.text}
            invalid={!!displayNameError}
            onChange={(displayName?: string) => {
              setEntity({
                ...entity,
                displayName,
              });
            }}
          />
          <DialTextInputField
            elementContainerClassName="max-w-[120px]"
            elementId="version"
            fieldTitle={t(EntityFieldsI18nKey.version)}
            onChange={(version?: string) => {
              if (version) {
                setEntity({
                  ...entity,
                  version,
                });
              }
            }}
            value={entity.version}
            invalid={!!versionError}
            errorText={versionError?.text}
          />
          <DialTextAreaField
            elementClassName="min-h-[118px]"
            elementId="description"
            fieldTitle={t(EntityFieldsI18nKey.description)}
            placeholder={t(EntityPlaceholdersI18nKey.Description)}
            value={entity.description}
            errorText={descriptionError?.text}
            invalid={!!descriptionError}
            optional={true}
            onChange={(description: string) => {
              setEntity({
                ...entity,
                description,
              });
            }}
          />
        </div>
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialButton variant={ButtonVariant.Secondary} label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialButton
          variant={ButtonVariant.Primary}
          label={t(ButtonsI18nKey.Create)}
          disabled={
            !(entity.version && entity.displayName && entity.name) ||
            !!nameError ||
            !!versionError ||
            !!displayNameError ||
            !!descriptionError
          }
          onClick={() => {
            onCreate(entity);
            onClose();
          }}
        />
      </div>
    </DialPopup>
  );
};

export default CreateAsset;
