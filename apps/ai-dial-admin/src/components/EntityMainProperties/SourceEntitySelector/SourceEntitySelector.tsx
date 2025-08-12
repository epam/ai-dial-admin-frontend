'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import ErrorText from '@/src/components/Common/ErrorText/ErrorText';
import Field from '@/src/components/Common/Field/Field';
import InputModal from '@/src/components/Common/InputModal/InputModal';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { PopUpState } from '@/src/types/pop-up';
import SelectRunnerModal from './SelectSourceEntityModal';
import { DialAdapter } from '@/src/models/dial/adapter';

interface Props {
  fieldTitle: string;
  placeholder: string;
  selectedValue?: string;
  sourceEntities?: (DialApplicationScheme | DialAdapter)[];
  isEntityImmutable?: boolean;
  onChangeValue: (value?: string) => void;
  optional?: boolean;
}

const SourceEntitySelector: FC<Props> = ({
  fieldTitle,
  selectedValue,
  placeholder,
  sourceEntities,
  onChangeValue,
  isEntityImmutable = false,
  optional,
}) => {
  const t = useI18n();

  const [modalState, setIsModalState] = useState(PopUpState.Closed);
  const [runnerTitle, setRunnerTitle] = useState('');
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

  // useEffect(() => {
  //   setRunnerTitle(
  //     sourceEntities?.find((r) => r.$id === customAppSchemaId)?.['dial:applicationTypeDisplayName'] ||
  //       customAppSchemaId ||
  //       '',
  //   );
  // }, [customAppSchemaId, sourceEntities]);

  return isEntityImmutable ? (
    <div className="flex flex-col">
      <Field fieldTitle={fieldTitle} htmlFor="sourceEntity" />
      <InputModal
        modalState={modalState}
        selectedValue={runnerTitle}
        onOpenModal={onOpenModal}
        inputCssClasses={errorText && 'input-error'}
      >
        <div>dddd</div>
        {/* <SelectRunnerModal
          selectedId={customAppSchemaId}
          onApply={onChange}
          modalState={modalState}
          onClose={onCloseModal}
          runners={sourceEntities}
        /> */}
      </InputModal>
      <ErrorText errorText={errorText} />
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
