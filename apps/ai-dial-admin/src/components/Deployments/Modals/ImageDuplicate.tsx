import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
  DialConfirmationPopup,
  DialRadioGroup,
  DialTextInputField,
  PopupSize,
  RadioButtonWithContent,
  RadioGroupOrientation,
} from '@epam/ai-dial-ui-kit';
import { debounce } from 'lodash';
import semver from 'semver';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { DUPLICATION_TYPE } from '@/src/types/deployments/images';
import {
  ButtonsI18nKey,
  EntitiesI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  ImagesI18nKey,
} from '@/src/constants/i18n';
import { getImageVersions } from '@/src/app/actions/deployments';
import { getSemanticVersionError } from '@/src/utils/deployments/validation';
import { getVersionsPerName } from '@/src/components/Assets/utils';
import { getRouteByType } from '@/src/utils/deployments/entity';
import { getImageType } from '@/src/utils/deployments/images';
import { getErrorForName } from '@/src/utils/validation/name-error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  title: string;
  isModalOpen: boolean;
  image: Image;
  onClose: () => void;
  onApply: (image: Image) => void;
  names?: string[];
}

const ImageDuplicateModal: FC<Props> = ({ title, isModalOpen, image, onClose, onApply, names }) => {
  const t = useI18n();
  const { dispatch, isValid } = useSaveValidationContext();
  const initialName = image.name;
  const originalVersion = image.version;

  const [copyImage, setCopyImage] = useState({
    ...image,
    version: semver.inc(originalVersion, 'patch') || originalVersion,
  });
  const [duplicationType, setDuplicationType] = useState<string>(DUPLICATION_TYPE.VERSION);
  const [isUniqNameError, setIsUniqNameError] = useState<boolean>(names?.includes(copyImage?.name || '') ?? false);

  const [nameError, setNameError] = useState<FieldError | null>(null);
  const [versionError, setVersionError] = useState<FieldError | null>(null);
  const [versionsMap, setVersionsMap] = useState<Record<string, string[]>>({});

  const duplicationTypes: RadioButtonWithContent[] = [
    { id: DUPLICATION_TYPE.VERSION, name: t(EntitiesI18nKey.NewVersion) },
    { id: DUPLICATION_TYPE.ENTITY, name: t(ImagesI18nKey.NewImage) },
  ];

  const verifyVersion = useMemo(
    () =>
      debounce((name: string) => {
        getImageVersions(name, getImageType(getRouteByType(copyImage.$type))).then(({ success, response }) => {
          const data = response as ImageVersion[];
          if (success && data.length > 0) {
            const versionMap = getVersionsPerName(data);
            setVersionsMap(versionMap);
            const error = getSemanticVersionError(
              versionMap,
              { name } as { name: string },
              t,
              (copyImage as Image).version,
            );
            setVersionError(error);
            dispatch({ type: ValidationActionType.SetField, field: 'version', isValid: !error });
          } else {
            setVersionsMap({});
            setVersionError(null);
            dispatch({ type: ValidationActionType.SetField, field: 'version', isValid: true });
          }
        });
      }, 500),
    [copyImage, dispatch, t],
  );

  const onChangeDuplicationType = useCallback(
    (type: string) => {
      setDuplicationType(type);
      if (type === DUPLICATION_TYPE.VERSION) {
        setCopyImage({ ...copyImage, name: initialName, version: semver.inc(originalVersion, 'patch') || '0.0.1' });
      } else {
        setCopyImage({
          ...copyImage,
          name: copyImage.name === initialName ? `${copyImage.name}-copy` : copyImage.name,
          version: originalVersion,
        });
      }
    },
    [copyImage, initialName, originalVersion],
  );

  const onChangeName = useCallback(
    (name?: string) => {
      const isUniqNameError = names?.includes(name as string) ?? false;
      const error = getErrorForName(
        name,
        names,
        t,
        duplicationType === DUPLICATION_TYPE.ENTITY && isUniqNameError,
        true,
      );
      setNameError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !error });
      verifyVersion(name as string);
      setCopyImage({ ...copyImage, name: name as string });
    },
    [copyImage, dispatch, duplicationType, names, t, verifyVersion],
  );

  const onChangeVersion = useCallback(
    (version?: string) => {
      const error = getSemanticVersionError(versionsMap, copyImage as { name: string }, t, version);
      setVersionError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'version', isValid: !error });
      setCopyImage({ ...copyImage, version: version || '' });
    },
    [copyImage, dispatch, t, versionsMap],
  );

  useEffect(() => {
    const nameError = getErrorForName(
      copyImage.name,
      [],
      t,
      duplicationType === DUPLICATION_TYPE.ENTITY && isUniqNameError,
      true,
    );
    const versionError = getSemanticVersionError(versionsMap, copyImage as { name: string }, t, copyImage.version);
    setNameError(nameError);
    setVersionError(versionError);
    dispatch({
      type: ValidationActionType.SetField,
      field: 'version',
      isValid: !versionError,
    });
    dispatch({
      type: ValidationActionType.SetField,
      field: 'name',
      isValid: !nameError,
    });
  }, [copyImage, dispatch, duplicationType, isUniqNameError, names, t, versionsMap]);

  useEffect(() => {
    getImageVersions(image.name || '', getImageType(getRouteByType(image.$type))).then(({ success, response }) => {
      const data = response as ImageVersion[];
      if (success && data.length > 0) {
        const versionMap = getVersionsPerName(data);
        setVersionsMap(versionMap);
      }
    });
  }, [image]);

  useEffect(() => {
    setIsUniqNameError(names?.includes(copyImage.name || '') ?? false);
  }, [copyImage.name, names]);

  return (
    <DialConfirmationPopup
      onClose={onClose}
      header={title}
      portalId="ImageDuplicateModal"
      open={isModalOpen}
      onConfirm={() => {
        onApply(copyImage);
        onClose();
      }}
      confirmLabel={t(ButtonsI18nKey.Duplicate)}
      disableConfirmButton={!isValid}
      size={PopupSize.Md}
    >
      <div className="flex flex-col h-full overflow-auto px-6 py-4 gap-y-8">
        <DialRadioGroup
          radioButtons={duplicationTypes}
          activeRadioButton={duplicationType}
          elementId="duplicationTypes"
          fieldTitle={t(EntitiesI18nKey.DuplicationType)}
          orientation={RadioGroupOrientation.Column}
          onChange={onChangeDuplicationType}
        />
        <DialTextInputField
          elementId="name"
          fieldTitle={t(EntityFieldsI18nKey.name)}
          placeholder={t(EntityPlaceholdersI18nKey.Name)}
          value={copyImage.name}
          errorText={nameError?.text}
          invalid={!!nameError}
          onChange={onChangeName}
        />
        <DialTextInputField
          elementContainerClassName="max-w-[120px]"
          fieldTitle={t(EntityFieldsI18nKey.version)}
          elementId="version"
          placeholder={t(EntityPlaceholdersI18nKey.Version)}
          value={copyImage.version}
          errorText={versionError?.text}
          invalid={!!versionError}
          onChange={onChangeVersion}
        />
      </div>
    </DialConfirmationPopup>
  );
};

export default ImageDuplicateModal;
