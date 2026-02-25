import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { DialInput } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Image } from '@/src/models/deployments/images';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getSemanticVersionError, getImageNameError } from '@/src/utils/deployments/validation';
import { getErrorForName } from '@/src/utils/validation/name-error';
import { useI18n } from '@/src/locales/client';

import DescriptionControl from '@/src/components/BaseControls/Description';
import Maintainer from '@/src/components/BaseControls/Maintainer';
import { getControlClassName } from '@/src/utils/entities/view';
import TopicsControl from '@/src/components/BaseControls/Topics';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  image: Image;
  setImage: (entity: Image) => void;
  isModal?: boolean;
  versionError: FieldError | null;
  setVersionError: (error: FieldError | null) => void;
  versionsMap: Record<string, string[]>;
  verifyVersion: (image: Image) => void;
}

const ImageBase: FC<Props> = ({
  image,
  setImage,
  isModal = false,
  versionsMap,
  versionError,
  setVersionError,
  verifyVersion,
}) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [nameError, setNameError] = useState<FieldError | null>(null);
  const containerClassName = useMemo(() => getControlClassName(isModal), [isModal]);

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'name',
      isValid: !getErrorForName(image.name, [], t, false, false),
    });
  }, [dispatch, image.name, t]);

  useEffect(() => {
    if (resetCounter || (image.name != null && image.name.length > 0)) {
      const error = getImageNameError(image.name, t);
      setNameError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'name',
        isValid: !error,
      });
    }
  }, [dispatch, image, resetCounter, t, versionsMap]);

  const onChangeVersion = useCallback(
    (version?: string) => {
      const error = getSemanticVersionError(versionsMap, image.name, t, version);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'version',
        isValid: !error,
      });
      setVersionError(error);
      setImage({
        ...image,
        version: version || '',
      });
    },
    [dispatch, image, setImage, setVersionError, t, versionsMap],
  );

  const onChangeName = useCallback(
    (name?: string) => {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'version',
        isValid: false,
      });
      const error = getErrorForName(name, [], t, false, false);
      dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !error });
      setNameError(error);
      const updated = {
        ...image,
        name: name || '',
      };
      verifyVersion(updated);
      setImage(updated);
    },
    [dispatch, image, setImage, setNameError, t, verifyVersion],
  );

  return (
    <div className="flex flex-col gap-y-8">
      <DialInput
        labelProps={{ label: t(EntityFieldsI18nKey.name) }}
        id="name"
        placeholder={t(EntityPlaceholdersI18nKey.Name)}
        value={image.name}
        containerClassName={containerClassName}
        onChange={onChangeName}
        errorText={nameError?.text}
        invalid={!!nameError}
      />
      {isModal && (
        <DialInput
          className="w-[120px]"
          labelProps={{ label: t(EntityFieldsI18nKey.version) }}
          id="version"
          placeholder={t(EntityPlaceholdersI18nKey.Version)}
          value={image.version}
          errorText={versionError?.text}
          invalid={!!versionError}
          onChange={onChangeVersion}
        />
      )}
      <DescriptionControl entity={image} onChangeEntity={setImage} isFullWidth={isModal} />
      {!isModal && (
        <>
          <Maintainer entity={image} onChangeEntity={setImage} />
          <TopicsControl entity={image} onChange={setImage} view={ApplicationRoute.Images} />
        </>
      )}
    </div>
  );
};

export default ImageBase;
