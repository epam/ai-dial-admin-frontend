'use client';

import { FC, useCallback, useState } from 'react';

import AutocompleteInput from '@/src/components/Common/AutocompleteInput/AutocompleteInput';
import { NumberInputField } from '@/src/components/Common/InputField/InputField';
import RadioField from '@/src/components/Common/RadioField/RadioField';
import { AttachmentsI18nKey, BasicI18nKey } from '@/src/constants/i18n';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { useI18n } from '@/src/locales/client';
import { RadioButtonModel } from '@/src/models/radio-button';
import { ALL_ATTACHMENTS } from '@/src/constants/dial-base-entity';
import { DialBaseEntity } from '@/src/models/dial/base-entity';

interface Props {
  entity: DialBaseEntity;

  onChangeEntity: (entity: DialBaseEntity) => void;
}

const EntityAttachments: FC<Props> = ({ entity, onChangeEntity }) => {
  const t = useI18n();

  const [activeAttachmentType, setActiveAttachmentType] = useState(getActiveAttach(entity.inputAttachmentTypes));

  const attachments: RadioButtonModel[] = [
    {
      id: BasicI18nKey.None,
      name: t(BasicI18nKey.None),
    },
    {
      id: AttachmentsI18nKey.AllAttachments,
      name: t(AttachmentsI18nKey.AllAttachments),
    },
    {
      id: AttachmentsI18nKey.CustomAttachments,
      name: t(AttachmentsI18nKey.CustomAttachments),
    },
  ];

  const onChangeAttachments = useCallback(
    (key: string) => {
      if (key === BasicI18nKey.None) {
        onChangeEntity({
          ...entity,
          maxInputAttachments: void 0,
          inputAttachmentTypes: [],
        });
      } else if (key === AttachmentsI18nKey.AllAttachments) {
        onChangeEntity({ ...entity, inputAttachmentTypes: [ALL_ATTACHMENTS] });
      } else if (key === AttachmentsI18nKey.CustomAttachments) {
        onChangeEntity({ ...entity, inputAttachmentTypes: [] });
      }
      setActiveAttachmentType(key as BasicI18nKey | AttachmentsI18nKey);
    },
    [entity, onChangeEntity],
  );

  const onChangeAttachmentMax = useCallback(
    (value: number | string) => {
      onChangeEntity({ ...entity, maxInputAttachments: value });
    },
    [entity, onChangeEntity],
  );

  const onChangeAttachmentTypes = useCallback(
    (types: string[]) => {
      onChangeEntity({ ...entity, inputAttachmentTypes: types });
    },
    [entity, onChangeEntity],
  );

  return (
    <div className="flex flex-col gap-4">
      <RadioField
        radioButtons={attachments}
        activeRadioButton={activeAttachmentType}
        elementId="attachments"
        fieldTitle={t(AttachmentsI18nKey.Attachments)}
        orientation={RadioFieldOrientation.Column}
        onChange={onChangeAttachments}
      />
      {activeAttachmentType === AttachmentsI18nKey.CustomAttachments && (
        <div className="pl-[26px]">
          <AutocompleteInput
            placeholder={t(AttachmentsI18nKey.EnterAttachmentsTypes)}
            selectedItems={entity.inputAttachmentTypes}
            updateSelected={onChangeAttachmentTypes}
          />
        </div>
      )}
      {activeAttachmentType !== BasicI18nKey.None && (
        <div className="w-[148px]">
          <NumberInputField
            elementId="maxAttachment"
            fieldTitle={t(AttachmentsI18nKey.AttachmentsMaxNumber)}
            placeholder={t(AttachmentsI18nKey.AttachmentsMaxNumberPlaceholder)}
            value={entity.maxInputAttachments}
            onChange={onChangeAttachmentMax}
          />
        </div>
      )}
    </div>
  );
};

export default EntityAttachments;

const getActiveAttach = (types?: string[]) => {
  if (!types) {
    return BasicI18nKey.None;
  }
  if (types.length === 1 && types[0] === ALL_ATTACHMENTS) {
    return AttachmentsI18nKey.AllAttachments;
  }

  return AttachmentsI18nKey.CustomAttachments;
};
