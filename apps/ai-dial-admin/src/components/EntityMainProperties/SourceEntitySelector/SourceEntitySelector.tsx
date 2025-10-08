'use client';

import { IconExternalLink } from '@tabler/icons-react';
import { ColDef } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { ButtonVariant, DialButton, DialErrorText } from '@epam/ai-dial-ui-kit';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import Field from '@/src/components/Common/Field/Field';
import InputModal from '@/src/components/Common/InputModal/InputModal';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import classNames from 'classnames';
import SelectSourceEntityModal from './SelectSourceEntityModal';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  fieldTitle: string;
  placeholder: string;
  buttonTitle: string;
  selectedValue?: string;
  sourceEntities?: (DialApplicationScheme | DialAdapter)[];
  isEntityImmutable?: boolean;
  route: ApplicationRoute;
  onChangeValue: (value?: string) => void;
  optional?: boolean;
  columns: ColDef[];
}

const SourceEntitySelector: FC<Props> = ({
  fieldTitle,
  selectedValue,
  placeholder,
  sourceEntities,
  onChangeValue,
  columns,
  buttonTitle,
  route,
  isEntityImmutable = false,
  optional,
}) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const { dispatch } = useSaveValidationContext();

  const [modalState, setIsModalState] = useState(PopUpState.Closed);
  const [valueTitle, setValueTitle] = useState('');

  const errorText = useMemo(() => {
    return !optional ? (selectedValue ? '' : t(ErrorI18nKey.RequiredField)) : void 0;
  }, [optional, selectedValue, t]);

  const onOpenModal = useCallback(() => {
    setIsModalState(PopUpState.Opened);
  }, [setIsModalState]);

  const onCloseModal = useCallback(() => {
    setIsModalState(PopUpState.Closed);
  }, [setIsModalState]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'sourceEntitySelector', isValid: !errorText });
    return () => dispatch({ type: ValidationActionType.SetField, field: 'sourceEntitySelector', isValid: true });
  }, [errorText, t, dispatch]);

  const dropdownItems = useMemo(() => {
    return (
      sourceEntities?.map((entity) => ({
        id: (entity as DialApplicationScheme).$id || (entity as DialAdapter).name || '',
        name:
          (entity as DialApplicationScheme)['dial:applicationTypeDisplayName'] ||
          (entity as DialAdapter).displayName ||
          (entity as DialAdapter).name ||
          '',
      })) || ([] as DropdownItemsModel[])
    );
  }, [sourceEntities]);

  const onChange = useCallback(
    (value?: string) => {
      onChangeValue(value);

      onCloseModal();
    },
    [onChangeValue, onCloseModal],
  );

  const openInNewTab = useCallback(() => {
    window.open(`/${currentLocale}${route}/${encodeURIComponent(`${selectedValue}`)}`, '_blank');
  }, [currentLocale, route, selectedValue]);

  useEffect(() => {
    setValueTitle(dropdownItems?.find((r) => r.id === selectedValue)?.name || '');
  }, [selectedValue, dropdownItems]);

  return isEntityImmutable ? (
    <div className={classNames('flex flex-row gap-2 items-start', 'w-full')}>
      <div className={classNames('flex flex-col', isEntityImmutable ? 'lg:w-[35%]' : 'w-full')}>
        <Field fieldTitle={fieldTitle} htmlFor="sourceEntity" />
        <InputModal
          modalState={modalState}
          selectedValue={valueTitle}
          onOpenModal={onOpenModal}
          inputCssClasses={errorText && 'input-error'}
        >
          <SelectSourceEntityModal
            title={fieldTitle}
            selectedId={selectedValue}
            onApply={onChange}
            modalState={modalState}
            columns={columns}
            onClose={onCloseModal}
            sourceEntities={sourceEntities}
          />
        </InputModal>
        <DialErrorText errorText={errorText} />
      </div>
      {selectedValue && (
        <DialButton
          variant={ButtonVariant.Secondary}
          cssClass="mt-[22px]"
          title={buttonTitle}
          iconBefore={<IconExternalLink {...BASE_ICON_PROPS} />}
          onClick={openInNewTab}
        />
      )}
    </div>
  ) : (
    <DropdownField
      selectedValue={selectedValue}
      elementId="sourceEntity"
      items={dropdownItems}
      fieldTitle={fieldTitle}
      placeholder={placeholder}
      onChange={onChange}
      optional={optional}
      errorText={errorText}
    />
  );
};

export default SourceEntitySelector;
