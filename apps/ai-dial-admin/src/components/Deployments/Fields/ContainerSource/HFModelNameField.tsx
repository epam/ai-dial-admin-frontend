import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { isEditDisabled } from '@/src/utils/deployments/containers';
import { OutlinedButton } from '@epam/ai-dial-ui-kit';
import AutocompleteInput from '@/src/components/Common/AutocompleteInput/AutocompleteInput';
import { FIELD_ALIGNED_BUTTON_CLASS_NAME } from '@/src/components/Deployments/Fields/ContainerSource/constants';
import { AutocompleteInputOption } from '@/src/components/Common/AutocompleteInput/models';
import { Container, HuggingFaceModel } from '@/src/models/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getControlClassName } from '@/src/utils/entities/view';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getErrorForHfModelName } from '@/src/utils/deployments/validation';
import { debounce } from 'lodash';
import { getHuggingFaceModels } from '@/src/app/actions/deployments';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import OpenPopup from '@/public/images/icons/open-pop-up.svg';
import { createPortal } from 'react-dom';
import HFRegistryModal from '@/src/components/Deployments/Modals/HFRegistryModal/HuggingfaceRegistry';
import { ApplicationRoute } from '@/src/types/routes';

const SUGGESTION_COUNT = 5;

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  isModal?: boolean;
  route: ApplicationRoute;
  disabled?: boolean;
}
const HfModelNameField: FC<Props> = ({ container, setContainer, isModal, route, disabled }) => {
  const isDisabled = (disabled ?? isEditDisabled(container)) || container.status === CONTAINER_STATUS.RUNNING;
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const [modelOptions, setModelOptions] = useState<AutocompleteInputOption[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // The typed id becomes the model name only when the field is left or a suggestion is picked.
  const [modelNameText, setModelNameText] = useState(container.source?.modelName ?? '');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const latestQueryRef = useRef('');

  useEffect(() => {
    setModelNameText(container.source?.modelName ?? '');
  }, [container.source?.modelName]);

  const [modelNameError, setModelNameError] = useState<FieldError | null>(null);

  const containerClassName = useMemo(() => getControlClassName(isModal), [isModal]);

  const onChangeModelName = useCallback(
    (value?: string) => {
      const error = getErrorForHfModelName(value, t);
      setModelNameError(error);
      setContainer({ ...container, source: { ...container.source, modelName: value } });

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
      debounce(async (value: string) => {
        latestQueryRef.current = value;
        if (value.length <= 2) {
          setModelOptions([]);
          setIsLoadingModels(false);
          return;
        }
        setIsLoadingModels(true);
        try {
          const { success, response } = await getHuggingFaceModels({ search: value });
          // A slower response for an earlier query must not replace the current one's suggestions.
          if (latestQueryRef.current !== value) return;
          const models = success ? (response.models as HuggingFaceModel[]) : [];
          setModelOptions(models.slice(0, SUGGESTION_COUNT).map((model) => ({ value: model.id, label: model.id })));
        } finally {
          if (latestQueryRef.current === value) {
            setIsLoadingModels(false);
          }
        }
      }, 100),
    [],
  );

  const onModelNameTextChange = useCallback(
    (text: string) => {
      setModelNameText(text);
      onModelNameType(text);
    },
    [onModelNameType],
  );

  const onPickModel = useCallback(
    (option: AutocompleteInputOption) => {
      setModelNameText(option.value);
      onChangeModelName(option.value);
    },
    [onChangeModelName],
  );

  const onCommitModelName = useCallback(
    (text: string) => {
      // Tabbing through an untouched field must not mark the form changed or raise a required error.
      if (text === (container.source?.modelName ?? '')) {
        return;
      }
      onChangeModelName(text);
    },
    [onChangeModelName, container.source?.modelName],
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

  useEffect(() => {
    const error = getErrorForHfModelName(container.source?.modelName, t);
    dispatch({ type: ValidationActionType.SetField, field: 'modelName', isValid: !error });
    return () => dispatch({ type: ValidationActionType.RemoveField, field: 'modelName' });
  }, [container.source?.modelName, dispatch, t]);

  return (
    <>
      <div className="flex items-start gap-3">
        <AutocompleteInput
          id="modelName"
          labelProps={{ label: t(EntityFieldsI18nKey.HFModelName), required: true }}
          placeholder={t(EntityPlaceholdersI18nKey.HFModelName)}
          value={modelNameText}
          suggestions={modelOptions}
          isLoading={isLoadingModels}
          shouldFilterSuggestions={false}
          openOnFocus
          onChange={onModelNameTextChange}
          onSelect={onPickModel}
          onCommit={onCommitModelName}
          error={modelNameError?.text}
          invalid={!!modelNameError?.text}
          className={containerClassName}
          disabled={isDisabled}
        />
        <OutlinedButton
          onClick={handleModalOpen}
          label={t(ButtonsI18nKey.HFRegistry)}
          iconBefore={<OpenPopup {...BASE_BUTTON_ICON_PROPS} />}
          className={FIELD_ALIGNED_BUTTON_CLASS_NAME}
          disabled={isDisabled}
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
