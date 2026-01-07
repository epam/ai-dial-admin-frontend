import { FC, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { debounce } from 'lodash';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getImageVersions } from '@/src/app/actions/deployments';
import { getSemanticVersionError } from '@/src/utils/deployments/validation';
import { getVersionsPerName } from '@/src/components/Assets/utils';
import { useI18n } from '@/src/locales/client';

import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import Maintainer from '@/src/components/EntityMainProperties/BaseProperties/Maintainer';
import TopicField from '@/src/components/Images/Fields/TopicField';

interface Props {
  image: Image;
  setImage: (entity: Image) => void;
  isModal?: boolean;
}

const BaseFields: FC<Props> = ({ image, setImage, isModal }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const [versionsMap, setVersionsMap] = useState<Record<string, string[]>>({});
  const [versionError, setVersionError] = useState<FieldError | null>(null);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!image.name });
  }, [dispatch, image, t, versionsMap]);

  const verifyVersion = useMemo(
    () =>
      debounce((name?: string) => {
        if (name) {
          getImageVersions(name).then(({ success, response }) => {
            const data = response as ImageVersion[];
            if (success && data.length > 0) {
              const versionMap = getVersionsPerName(data);
              setVersionsMap(versionMap);
              const error = getSemanticVersionError(versionMap, { name }, t, image.version);
              setVersionError(error);
              dispatch({
                type: ValidationActionType.SetField,
                field: 'version',
                isValid: !error,
              });
            } else {
              setVersionsMap({});
              setVersionError(null);
              dispatch({ type: ValidationActionType.SetField, field: 'version', isValid: true });
            }
          });
        } else {
          setVersionsMap({});
          setVersionError(null);
        }
      }, 500),
    [dispatch, image.version, t],
  );

  return (
    <div className={classNames('flex flex-col gap-4', !isModal && 'lg:w-[35%] gap-8')}>
      <DialTextInputField
        fieldTitle={t(EntityFieldsI18nKey.name)}
        elementId="name"
        placeholder={t(EntityPlaceholdersI18nKey.Name)}
        value={image.name}
        onChange={(name?: string) => {
          verifyVersion(name);
          setImage({
            ...image,
            name: name || '',
          });
        }}
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
