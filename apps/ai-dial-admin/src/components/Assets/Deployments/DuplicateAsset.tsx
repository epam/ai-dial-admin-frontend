import { DialFormPopup, DialRadioGroup, RadioButtonWithContent, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useState } from 'react';

import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import VersionControl from '@/src/components/BaseControls/Version';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import { BasicI18nKey, ButtonsI18nKey, EntitiesI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DuplicationTypes } from '@/src/types/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { duplicateEntityMap, getClonedEntityName, getCloneTitle } from '@/src/utils/entities/duplicate-entity';
import { isDeploymentAsset } from '@/src/utils/is-asset-view';
import { checkNameVersionCombination, getInitialVersion } from '@/src/utils/prompts/versions';
import { addTrailingSlash } from '@/src/utils/url';

interface Props {
  view: ApplicationRoute;
  isModalOpen: boolean;
  entity: AssetWithVersion;
  versionsMap: Record<string, string[]>;
  context?: () => AssetsFolderContext;
  onClose: () => void;
  onDuplicate: (entity: AssetWithVersion) => void;
}

const DuplicateAsset: FC<Props> = ({ view, isModalOpen, entity, versionsMap, context, onDuplicate, onClose }) => {
  const t = useI18n();
  const initialName = entity.name;
  const initialFolder = entity.folderId;
  const [duplicationType, setDuplicationType] = useState<string>(DuplicationTypes.VERSION);

  const duplicationTypes: RadioButtonWithContent[] = [
    { id: DuplicationTypes.VERSION, name: t(EntitiesI18nKey.NewVersion) },
    { id: DuplicationTypes.ENTITY, name: t(EntitiesI18nKey.NewEntity, { entity: t(duplicateEntityMap[view]) }) },
  ];

  const [clonedAsset, setClonedAsset] = useState<AssetWithVersion>({
    ...entity,
    name: getClonedEntityName(entity.name, duplicationType === DuplicationTypes.VERSION),
    displayName: isDeploymentAsset(view) ? entity.displayName : void 0,
    version: getInitialVersion(versionsMap, entity?.name),
  });
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(
      !!clonedAsset.name &&
        !!clonedAsset.version &&
        !checkNameVersionCombination(versionsMap, clonedAsset.name, clonedAsset.version),
    );
  }, [clonedAsset, versionsMap]);

  const onChangeName = useCallback(
    (displayName?: string) => {
      setClonedAsset({ ...clonedAsset, displayName });
    },
    [setClonedAsset, clonedAsset],
  );

  const onChangeVersion = useCallback(
    (version?: string) => {
      setClonedAsset({ ...clonedAsset, version: version || '' });
    },
    [setClonedAsset, clonedAsset],
  );

  const onChangePath = useCallback(
    (folderId: string) => {
      setClonedAsset({ ...clonedAsset, folderId });
    },
    [setClonedAsset, clonedAsset],
  );

  const onChangeDuplicationType = useCallback(
    (type: string) => {
      setDuplicationType(type);
      if (type === DuplicationTypes.VERSION) {
        setClonedAsset({ ...clonedAsset, name: initialName });
      } else {
        setClonedAsset({
          ...clonedAsset,
          folderId: initialFolder,
          name: entity.name === initialName ? getClonedEntityName(entity.name) : entity.name,
        });
      }
    },
    [clonedAsset, initialName, initialFolder, entity.name],
  );

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(getCloneTitle(view, t))}
      portalId="DuplicateAsset"
      open={isModalOpen}
      onSubmit={() => onDuplicate({ ...clonedAsset, folderId: addTrailingSlash(clonedAsset.folderId) })}
      onCancel={onClose}
      disableSubmitButton={!isValid}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Duplicate)}
    >
      <div className="flex flex-col px-6 py-4 gap-4">
        <DialRadioGroup
          radioButtons={duplicationTypes}
          activeRadioButton={duplicationType}
          elementId="duplicationTypes"
          fieldTitle={t(EntitiesI18nKey.DuplicationType)}
          orientation={RadioGroupOrientation.Column}
          onChange={onChangeDuplicationType}
        />
        <IdControl
          entity={clonedAsset}
          onChangeEntity={setClonedAsset}
          disabled={duplicationType === DuplicationTypes.VERSION}
        />
        {isDeploymentAsset(view) && (
          <DisplayNameControl displayName={clonedAsset.displayName} onChange={onChangeName} required />
        )}
        <VersionControl version={clonedAsset.version} onChange={onChangeVersion} />

        {duplicationType === DuplicationTypes.ENTITY && (
          <FilePath
            value={clonedAsset.folderId}
            label={t(EntitiesI18nKey.FolderStorage)}
            modalTitle={t(BasicI18nKey.MoveToFolder)}
            placeholder={t(EntityPlaceholdersI18nKey.Path)}
            onChange={onChangePath}
            context={context}
          />
        )}
      </div>
    </DialFormPopup>
  );
};

export default DuplicateAsset;
