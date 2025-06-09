'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import Field from '@/src/components/Common/Field/Field';
import InputModal from '@/src/components/Common/InputModal/InputModal';
import { CreateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { PopUpState } from '@/src/types/pop-up';
import SelectRunnerModal from './SelectRunnerModal';

interface Props {
  entity: DialBaseEntity;
  runners?: DialApplicationScheme[];
  isEditEntityView?: boolean;
  onChangeEntity: (entity: DialBaseEntity) => void;
}

const RunnerSelector: FC<Props> = ({ entity, runners, onChangeEntity, isEditEntityView = false }) => {
  const t = useI18n();

  const customAppSchemaId = (entity as DialApplication)?.customAppSchemaId;
  const [modalState, setIsModalState] = useState(PopUpState.Closed);
  const [runnerTitle, setRunnerTitle] = useState('');

  const onOpenModal = useCallback(() => {
    setIsModalState(PopUpState.Opened);
  }, [setIsModalState]);

  const onCloseModal = useCallback(() => {
    setIsModalState(PopUpState.Closed);
  }, [setIsModalState]);

  const runnerDropdownItems: DropdownItemsModel[] =
    runners?.map((adapter) => ({
      id: adapter.$id || '',
      name: adapter['dial:applicationTypeDisplayName'] || '',
    })) || [];

  const onChangeRunner = useCallback(
    (customAppSchemaId?: string) => {
      onChangeEntity({ ...entity, customAppSchemaId, endpoint: void 0 } as DialApplication);
      onCloseModal();
    },
    [entity, onChangeEntity, onCloseModal],
  );

  useEffect(() => {
    setRunnerTitle(
      runners?.find((r) => r.$id === customAppSchemaId)?.['dial:applicationTypeDisplayName'] || customAppSchemaId || '',
    );
  }, [customAppSchemaId, runners]);

  return isEditEntityView ? (
    <div className="flex flex-col">
      <Field fieldTitle={t(CreateI18nKey.RunnerName)} htmlFor="runner" />
      <InputModal modalState={modalState} selectedValue={runnerTitle} onOpenModal={onOpenModal}>
        <SelectRunnerModal
          selectedId={customAppSchemaId}
          onApply={onChangeRunner}
          modalState={modalState}
          onClose={onCloseModal}
          runners={runners}
        />
      </InputModal>
    </div>
  ) : (
    <DropdownField
      selectedValue={customAppSchemaId}
      elementId="runner"
      items={runnerDropdownItems}
      fieldTitle={t(CreateI18nKey.RunnerName)}
      placeholder={t(CreateI18nKey.RunnerPlaceholder)}
      onChange={onChangeRunner}
      optional={true}
    />
  );
};

export default RunnerSelector;
