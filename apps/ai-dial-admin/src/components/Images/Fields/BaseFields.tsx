import { FC, useEffect, useState } from 'react';
import classNames from 'classnames';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Image } from '@/src/models/deployments/images';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getSemanticVersionError } from '@/src/utils/deployments/validation';
import { getErrorForName } from '@/src/utils/validation/name-error';
import { useI18n } from '@/src/locales/client';

import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import Maintainer from '@/src/components/EntityMainProperties/BaseProperties/Maintainer';
import TopicField from '@/src/components/Images/Fields/TopicField';

interface Props {
  image: Image;
  setImage: (entity: Image) => void;
  isModal?: boolean;
  versionError: FieldError | null;
  setVersionError: (error: FieldError | null) => void;
  versionsMap: Record<string, string[]>;
  verifyVersion: (image: Image) => void;
}

const BaseFields: FC<Props> = ({
  image,
  setImage,
  isModal,
  versionsMap,
  versionError,
  setVersionError,
  verifyVersion,
}) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [nameError, setNameError] = useState<FieldError | null>(null);

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'name',
      isValid: !getErrorForName(image.name, [], t, false, false),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetCounter || (image.name != null && image.name.length > 0)) {
      const error = getErrorForName(image.name, [], t, false, false);
      setNameError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'name',
        isValid: !error,
      });
    }
  }, [dispatch, image, resetCounter, t, versionsMap]);

  return (
    <div className={classNames('flex flex-col gap-4', !isModal && 'lg:w-[35%] gap-8')}>
      <DialTextInputField
        fieldTitle={t(EntityFieldsI18nKey.name)}
        elementId="name"
        placeholder={t(EntityPlaceholdersI18nKey.Name)}
        value={image.name}
        onChange={(name?: string) => {
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
        }}
        errorText={nameError?.text}
        invalid={!!nameError}
      />
      {isModal && (
        <DialTextInputField
          elementContainerClassName="max-w-[120px]"
          fieldTitle={t(EntityFieldsI18nKey.version)}
          elementId="version"
          placeholder={t(EntityPlaceholdersI18nKey.Version)}
          value={image.version}
          errorText={versionError?.text}
          invalid={!!versionError}
          onChange={(version?: string) => {
            const error = getSemanticVersionError(versionsMap, image as { name: string }, t, version);
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
          }}
        />
      )}
      <DescriptionControl entity={image} onChangeEntity={setImage} isFullWidth={isModal} />
      {!isModal && (
        <>
          <Maintainer entity={image} onChangeEntity={setImage} />
          <TopicField image={image} setImage={setImage} />
        </>
      )}
    </div>
  );
};

export default BaseFields;
