import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { isEditDisabled } from '@/src/utils/deployments/containers';
import { DialNeutralButton, DialSelectField } from '@epam/ai-dial-ui-kit';
import { Container, HuggingFaceModel } from '@/src/models/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getControlClassName } from '@/src/utils/entities/view';
import { CONTAINER_STATUS, SERVING_SOURCE } from '@/src/types/deployments/containers';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getErrorForHfModelName } from '@/src/utils/deployments/validation';
import { debounce } from 'lodash';
import { getHuggingFaceModels } from '@/src/app/actions/deployments';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import OpenPopup from '@/public/images/icons/open-pop-up.svg';
import { createPortal } from 'react-dom';
import HFRegistryModal from '@/src/components/Deployments/Modals/HuggingfaceRegistry';
import classNames from 'classnames';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  isModal?: boolean;
  route: ApplicationRoute;
}
const HfModelNameField: FC<Props> = ({ container, setContainer, isModal, route }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const [modelOptions, setModelOptions] = useState<{ value: string; label: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [modelNameError, setModelNameError] = useState<FieldError | null>(null);

  const containerClassName = useMemo(() => getControlClassName(isModal), [isModal]);

  const onChangeModelName = useCallback(
    (value?: string) => {
      const error = getErrorForHfModelName(value, t);
      setModelNameError(error);
      setContainer({ ...container, source: { ...container.source, modelName: value } as SERVING_SOURCE });

      dispatch({
        type: ValidationActionType.SetField,
        field: 'modelName',
        isValid: !error,
      });
    },
    [container, setContainer, dispatch, t],
  );

  const onModelNameType = useMemo(
    () =>
      debounce((value: string) => {
        if (value.length > 2) {
          getHuggingFaceModels({ search: value }).then(({ success, response }) => {
            if (success) {
              const models = response.models as HuggingFaceModel[];
              if (models.length) {
                setModelOptions(models.slice(0, 5).map((model) => ({ value: model.id, label: model.id })));
              }
            }
          });
        }
      }, 100),
    [],
  );

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleModalOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (resetCounter || (container.source?.modelName && container.source?.modelName.length > 0)) {
      const error = getErrorForHfModelName(container.source?.modelName, t);
      setModelNameError(error);
    }
  }, [container.source?.modelName, resetCounter, t]);
  return (
    <>
      <div className="flex gap-3">
        <DialSelectField
          elementId="modelName"
          fieldTitle={t(EntityFieldsI18nKey.HFModelName)}
          placeholder={t(EntityPlaceholdersI18nKey.HFModelName)}
          inlineSearch={true}
          value={container.source?.modelName}
          customSelectedValue={container.source?.modelName}
          onChange={(value) => onChangeModelName(value as string)}
          onInlineQueryChange={(value) => onModelNameType(value)}
          options={modelOptions}
          error={modelNameError?.text}
          containerClassName={containerClassName}
          disabled={isEditDisabled(container) || container.status === CONTAINER_STATUS.RUNNING}
        />
        <DialNeutralButton
          onClick={handleModalOpen}
          label={t(ButtonsI18nKey.HFRegistry)}
          iconBefore={<OpenPopup {...BASE_BUTTON_ICON_PROPS} />}
          className={classNames(modelNameError?.text ? 'self-center mb-1' : 'self-end', 'shrink-0')}
          disabled={isEditDisabled(container) || container.status === CONTAINER_STATUS.RUNNING}
        />
      </div>
      {isModalOpen &&
        createPortal(
          <HFRegistryModal
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            onApply={(modelName) => onChangeModelName(modelName)}
            preselectedModelName={container.source?.modelName}
            route={route}
          />,
          document.body,
        )}
    </>
  );
};

export default HfModelNameField;
