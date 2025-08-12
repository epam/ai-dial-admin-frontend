'use client';

import { ColDef } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { IconExternalLink } from '@tabler/icons-react';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import ErrorText from '@/src/components/Common/ErrorText/ErrorText';
import Field from '@/src/components/Common/Field/Field';
import InputModal from '@/src/components/Common/InputModal/InputModal';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { PopUpState } from '@/src/types/pop-up';
import SelectSourceEntityModal from './SelectSourceEntityModal';
import Button from '@/src/components/Common/Button/Button';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { ApplicationRoute } from '@/src/types/routes';
import classNames from 'classnames';

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

  const [modalState, setIsModalState] = useState(PopUpState.Closed);
  const [valueTitle, setValueTitle] = useState('');
  const [errorText, setErrorText] = useState('');

  const onOpenModal = useCallback(() => {
    setIsModalState(PopUpState.Opened);
  }, [setIsModalState]);

  const onCloseModal = useCallback(() => {
    setIsModalState(PopUpState.Closed);
  }, [setIsModalState]);

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
      if (!optional) {
        setErrorText(value ? '' : t(ErrorI18nKey.RequiredField));
      }
    },
    [onChangeValue, onCloseModal, optional, t],
  );

  const openInNewTab = useCallback(() => {
    window.open(`/${currentLocale}${route}/${encodeURIComponent(`${selectedValue}`)}`, '_blank');
  }, [currentLocale, route, selectedValue]);

  useEffect(() => {
    setValueTitle(dropdownItems?.find((r) => r.id === selectedValue)?.name || '');
  }, [selectedValue, dropdownItems]);

  return isEntityImmutable ? (
    <div className={classNames('flex flex-row gap-4 items-start', 'w-full')}>
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
        <ErrorText errorText={errorText} />
      </div>
      {selectedValue && (
        <Button
          cssClass="secondary mt-[22px]"
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
    />
  );
};

export default SourceEntitySelector;
