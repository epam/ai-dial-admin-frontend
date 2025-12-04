import { FC, useMemo, useState } from 'react';
import { debounce } from 'lodash';
import { DialTextAreaField, DialTextInputField } from '@epam/ai-dial-ui-kit';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { FieldError } from '@/src/models/error';
import { useI18n } from '@/src/locales/client';
import { getImageVersions } from '@/src/app/actions/deployments';
import { getMaintainerError, getSemanticVersionError } from '@/src/utils/deployments/validation';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { getVersionsPerName } from '@/src/components/Assets/utils';

interface Props {
  image: Image;
  setImage: (entity: Image) => void;
  isModal?: boolean;
  setVersionError?: (error: FieldError | null) => void;
}

const BaseProperties: FC<Props> = ({ image, setImage, isModal, setVersionError: setError }) => {
  const t = useI18n();

  const [versionsMap, setVersionsMap] = useState<Record<string, string[]>>({});
  const [versionError, setVersionError] = useState<FieldError | null>(null);
  const [descriptionError, setDescriptionError] = useState<FieldError | null>(null);
  const [maintainerError, setMaintainerError] = useState<FieldError | null>(null);

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
              setError?.(error);
            } else {
              setVersionsMap({});
              setVersionError(null);
              setError?.(null);
            }
          });
        } else {
          setVersionsMap({});
          setVersionError(null);
        }
      }, 500),
    [image.version, setError, t],
  );

  return (
    <>
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
      <DialTextAreaField
        elementId="description"
        fieldTitle={t(EntityFieldsI18nKey.description)}
        placeholder={t(EntityPlaceholdersI18nKey.Description)}
        elementClassName="min-h-[118px]"
        optional={true}
        value={image.description}
        errorText={descriptionError?.text}
        invalid={!!descriptionError}
        onChange={(description: string) => {
          setDescriptionError(getErrorForDescription(description, t));
          setImage({
            ...image,
            description,
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
            setVersionError(error);
            setError?.(error);
            setImage({
              ...image,
              version: version || '',
            });
          }}
        />
      )}
      {!isModal && (
        <DialTextInputField
          elementId="author"
          fieldTitle={t(EntityFieldsI18nKey.author)}
          placeholder={t(EntityPlaceholdersI18nKey.Maintainer)}
          value={image.author}
          disabled={false}
          optional={true}
          errorText={maintainerError?.text}
          invalid={!!maintainerError}
          onChange={(author?: string) => {
            setMaintainerError(getMaintainerError(author, t));
            setImage({
              ...image,
              author: author || '',
            });
          }}
        />
      )}
    </>
  );
};

export default BaseProperties;
