'use client';

import { FC, useCallback } from 'react';

import AttachmentInput from '@/src/components/Common/AttachmentInput/AttachmentInput';
import { NumberInputField } from '@/src/components/Common/InputField/InputField';
import { AttachmentsI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { mimeMapping } from './constants';

interface Props {
  entity: DialBaseEntity;
  onChangeEntity: (entity: DialBaseEntity) => void;
}

const EntityAttachments: FC<Props> = ({ entity, onChangeEntity }) => {
  const t = useI18n();

  const onChangeAttachmentMax = useCallback(
    (value: number | string) => {
      onChangeEntity({ ...entity, maxInputAttachments: value });
    },
    [entity, onChangeEntity],
  );

  const onChangeAttachmentTypes = useCallback(
    (types: string[]) => {
      if (types.length) {
        onChangeEntity({ ...entity, inputAttachmentTypes: types });
      } else {
        onChangeEntity({
          ...entity,
          maxInputAttachments: void 0,
          inputAttachmentTypes: void 0,
        });
      }
    },
    [entity, onChangeEntity],
  );

  return (
    <div className="flex flex-col gap-4">
      <AttachmentInput
        initialValues={entity.inputAttachmentTypes}
        fieldTitle={t(AttachmentsI18nKey.Attachments)}
        placeholder={t(AttachmentsI18nKey.EnterAttachmentsTypes)}
        allValueLabel={t(ButtonsI18nKey.UseAllAttachment)}
        availableItems={mimeMapping}
        onChange={(values) => onChangeAttachmentTypes(values)}
      />
      {entity.inputAttachmentTypes?.length && (
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
