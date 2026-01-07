import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
  DialNeutralButton,
  DialPopup,
  DialPrimaryButton,
  DialRadioGroup,
  DialTextInputField,
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
  BasicI18nKey,
  ButtonsI18nKey,
  EntitiesI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  ImagesI18nKey,
} from '@/src/constants/i18n';
import { getImageVersions } from '@/src/app/actions/deployments';
import { getSemanticVersionError } from '@/src/utils/deployments/validation';
import { getVersionsPerName } from '@/src/components/Assets/utils';

interface Props {
  title: string;
  isModalOpen: boolean;
  image: Image;
  onClose: () => void;
  onApply: (image: Image) => void;
}

const DuplicateImageModal: FC<Props> = ({ title, isModalOpen, image, onClose, onApply }) => {
  const t = useI18n();

  const containerClassName = 'flex flex-col lg:max-w-[55%] md:max-w-[75%]';
  const initialName = image.name;
  const originalVersion = image.version;

  const [copyImage, setCopyImage] = useState({
    ...image,
    version: semver.inc(originalVersion, 'patch') || originalVersion,
  });
  const [versionError, setVersionError] = useState<FieldError | null>(null);
  const [versionsMap, setVersionsMap] = useState<Record<string, string[]>>({});
  const [duplicationType, setDuplicationType] = useState<string>(DUPLICATION_TYPE.VERSION);

  const duplicationTypes: RadioButtonWithContent[] = [
    { id: DUPLICATION_TYPE.VERSION, name: t(EntitiesI18nKey.NewVersion) },
    { id: DUPLICATION_TYPE.ENTITY, name: t(ImagesI18nKey.NewImage) },
  ];

  const onChangeDuplicationType = useCallback(
    (type: string) => {
      setDuplicationType(type);
      if (type === DUPLICATION_TYPE.VERSION) {
        setCopyImage({ ...copyImage, name: initialName, version: semver.inc(originalVersion, 'patch') || '0.0.1' });
      } else {
        setCopyImage({
          ...copyImage,
          name:
            copyImage.name === initialName
              ? `${copyImage.name} ${t(BasicI18nKey.DuplicateCopyPostfix)}`
              : copyImage.name,
          version: originalVersion,
        });
      }
    },
    [copyImage, initialName, originalVersion, t],
  );

  const verifyVersion = useMemo(
    () =>
      debounce((name: string) => {
        getImageVersions(name).then(({ success, response }) => {
          const data = response as ImageVersion[];
          if (success && data.length > 0) {
            const versionMap = getVersionsPerName(data);
            setVersionsMap(versionMap);
            setVersionError(
              getSemanticVersionError(versionMap, { name } as { name: string }, t, (copyImage as Image).version),
            );
          } else {
            setVersionsMap({});
            setVersionError(null);
          }
        });
      }, 500),
    [copyImage, t],
  );

  useEffect(() => {
    getImageVersions(image.name).then(({ success, response }) => {
      const data = response as ImageVersion[];
      if (success && data.length > 0) {
        const versionMap = getVersionsPerName(data);
        setVersionsMap(versionMap);
      }
    });
  }, [image]);

  return (
    <DialPopup
      onClose={onClose}
      header={title}
      portalId="DuplicateImageModal"
      open={isModalOpen}
      className={containerClassName}
    >
      <div className="flex flex-col h-full overflow-auto px-6 py-4 gap-4">
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
          onChange={(name?: string) => {
            verifyVersion(name as string);
            setCopyImage({ ...copyImage, name: name as string });
          }}
        />
        <DialTextInputField
          elementContainerClassName="max-w-[120px]"
          fieldTitle={t(EntityFieldsI18nKey.version)}
          elementId="version"
          placeholder={t(EntityPlaceholdersI18nKey.Version)}
          value={copyImage.version}
          errorText={versionError?.text}
          invalid={!!versionError}
          onChange={(version?: string) => {
            setVersionError(getSemanticVersionError(versionsMap, copyImage as { name: string }, t, version));
            setCopyImage({ ...copyImage, version: version || '' });
          }}
        />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialPrimaryButton
          label={t(ButtonsI18nKey.Duplicate)}
          onClick={() => {
            onApply(copyImage);
            onClose();
          }}
          disabled={!!versionError}
        />
      </div>
    </DialPopup>
  );
};

export default DuplicateImageModal;
