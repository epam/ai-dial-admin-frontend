import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { DialInput } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { MODEL_SOURCE_TYPE, SERVING_SOURCE } from '@/src/types/deployments/containers';
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

  const onChangeImageRef = useCallback(
    (value?: string) => {
      const error = getDeploymentsURIError(value, t);
      setImageRefError(error);
      dispatch({
        type: ValidationActionType.SetField,
        field: 'modelSourceName',
        isValid: !error,
      });
      setContainer({ ...container, source: { ...container.source, imageRef: value } as SERVING_SOURCE });
    },
    [t, dispatch, setContainer, container],
  );

  useEffect(() => {
    if (resetCounter || (container.source?.imageRef && container.source?.imageRef.length > 0)) {
      const error = getDeploymentsURIError(container.source?.imageRef);
      setImageRefError(error);
    }
  }, [container.source?.imageRef, resetCounter]);

  return (
    <div className="flex flex-col gap-y-8">
      {container.source?.$type === MODEL_SOURCE_TYPE.NIM ? (
        <DialInput
          id="imageRef"
          labelProps={{ label: t(EntityFieldsI18nKey.ImageURI) }}
          placeholder={t(EntityPlaceholdersI18nKey.URI)}
          value={container.source?.imageRef}
          errorText={imageRefError?.text}
          invalid={!!imageRefError}
          onChange={onChangeImageRef}
          containerClassName={containerClassName}
          disabled={isEditDisabled(container)}
        />
      ) : (
        <HFModelNameField container={container} setContainer={setContainer} isModal={isModal} route={route} />
      )}
    </div>
  );
};

export default ContainerSource;
