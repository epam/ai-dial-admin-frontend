import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { DialInput } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { CONTAINER_SOURCE_TYPE } from '@/src/types/deployments/containers';
import { Container } from '@/src/models/deployments/containers';
import { FieldError } from '@/src/models/error';
import { getDeploymentsURIError } from '@/src/utils/deployments/validation';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { isEditDisabled } from '@/src/utils/deployments/containers';
import { getControlClassName } from '@/src/utils/entities/view';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import HFModelNameField from '@/src/components/Deployments/Fields/ContainerSource/HFModelNameField';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  isModal?: boolean;
  route: ApplicationRoute;
}

const ContainerSource: FC<Props> = ({ container, setContainer, isModal = false, route }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const containerClassName = useMemo(() => getControlClassName(isModal), [isModal]);

  const [imageRefError, setImageRefError] = useState<FieldError | null>(null);
  const [imageReferenceError, setImageReferenceError] = useState<FieldError | null>(null);

  const onChangeImageRef = useCallback(
    (value?: string) => {
      const error = getDeploymentsURIError(value, t);
      setImageRefError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'modelSourceName',
        isValid: !error,
      });
      setContainer({ ...container, source: { ...container.source, imageRef: value } });
    },
    [t, dispatch, setContainer, container],
  );

  const onChangeImageReference = useCallback(
    (value?: string) => {
      const error = getDeploymentsURIError(value, t);
      setImageReferenceError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'modelSourceName',
        isValid: !error,
      });
      setContainer({ ...container, source: { ...container.source, imageReference: value } });
    },
    [t, dispatch, setContainer, container],
  );

  useEffect(() => {
    if (resetCounter || (container.source?.imageRef && container.source?.imageRef.length > 0)) {
      const error = getDeploymentsURIError(container.source?.imageRef);
      setImageRefError(error);
    }
  }, [container.source?.imageRef, resetCounter]);

  useEffect(() => {
    if (resetCounter || (container.source?.imageReference && container.source?.imageReference.length > 0)) {
      const error = getDeploymentsURIError(container.source?.imageReference);
      setImageReferenceError(error);
    }
  }, [container.source?.imageReference, resetCounter]);

  const renderSourceField = () => {
    switch (container.source?.$type) {
      case CONTAINER_SOURCE_TYPE.NGC_REGISTRY:
        return (
          <DialInput
            id="imageRef"
            labelProps={{ label: t(EntityFieldsI18nKey.ImageURI) }}
            placeholder={t(EntityPlaceholdersI18nKey.URI)}
            value={container.source?.imageRef}
            error={imageRefError?.text}
            invalid={!!imageRefError}
            onChange={onChangeImageRef}
            containerClassName={containerClassName}
            disabled={isEditDisabled(container)}
          />
        );
      case CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE:
        return (
          <DialInput
            id="imageReference"
            labelProps={{ label: t(EntityFieldsI18nKey.DockerImageReference) }}
            placeholder={t(EntityPlaceholdersI18nKey.URI)}
            value={container.source?.imageReference}
            error={imageReferenceError?.text}
            invalid={!!imageReferenceError}
            onChange={onChangeImageReference}
            containerClassName={containerClassName}
            disabled={isEditDisabled(container)}
          />
        );
      default:
        return <HFModelNameField container={container} setContainer={setContainer} isModal={isModal} route={route} />;
    }
  };

  return <div className="flex flex-col gap-y-8">{renderSourceField()}</div>;
};

export default ContainerSource;
