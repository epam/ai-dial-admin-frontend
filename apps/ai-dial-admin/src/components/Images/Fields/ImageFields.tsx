import { FC, useMemo, useState } from 'react';

import { Image, ImageVersion } from '@/src/models/deployments/images';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { debounce } from 'lodash';
import { getImageVersions } from '@/src/app/actions/deployments';
import { getImageType } from '@/src/utils/deployments/images';
import { getRouteByType } from '@/src/utils/deployments/entity';
import { getVersionsPerName } from '@/src/components/Assets/utils';
import { getSemanticVersionError } from '@/src/utils/deployments/validation';
import { useI18n } from '@/src/locales/client';

import ImageBase from '@/src/components/Deployments/Fields/ImageBase';
import ImageSource from '@/src/components/Deployments/Fields/ImageSource';
import ImageTransport from '@/src/components/Deployments/Fields/ImageTransport';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
  isModal?: boolean;
  setImageVersions?: (versions: ImageVersion[]) => void;
}

const ImageFields: FC<Props> = ({ image, setImage, isModal, setImageVersions }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const [versionsMap, setVersionsMap] = useState<Record<string, string[]>>({});
  const [versionError, setVersionError] = useState<FieldError | null>(null);

  const verifyVersion = useMemo(
    () =>
      debounce((updatedImage: Image) => {
        if (updatedImage.name) {
          getImageVersions(updatedImage.name, getImageType(getRouteByType(updatedImage.$type))).then(
            ({ success, response }) => {
              const data = response as ImageVersion[];
              if (success && data.length > 0) {
                if (setImageVersions) {
                  setImageVersions(data as ImageVersion[]);
                }
                const versionMap = getVersionsPerName(data);
                setVersionsMap(versionMap);
                const error = getSemanticVersionError(versionMap, updatedImage.name, t, image.version);
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
            },
          );
        } else {
          setVersionsMap({});
          setVersionError(null);
          dispatch({
            type: ValidationActionType.SetField,
            field: 'version',
            isValid: true,
          });
        }
      }, 500),
    [dispatch, image.version, setImageVersions, t],
  );

  return (
    <div className="flex flex-col size-full gap-y-8">
      <div className="pb-8 border-b border-primary">
        <ImageBase
          image={image}
          setImage={setImage}
          isModal={isModal}
          versionsMap={versionsMap}
          versionError={versionError}
          setVersionError={setVersionError}
          verifyVersion={verifyVersion}
        />
      </div>
      <ImageSource image={image} setImage={setImage} isModal={isModal} verifyVersion={verifyVersion} />
      {!isModal && <ImageTransport image={image} setImage={setImage} />}
    </div>
  );
};

export default ImageFields;
