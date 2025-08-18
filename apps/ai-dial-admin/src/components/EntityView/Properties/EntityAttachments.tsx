'use client';

import { FC, useCallback, useState } from 'react';

import AttachmentInput from '@/src/components/Common/AttachmentInput/AttachmentInput';
import { NumberInputField } from '@/src/components/Common/InputField/InputField';
import { AttachmentsI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { mimeMapping } from './constants';
import { MAX_ATTACHMENTS_LIMIT } from '@/src/constants/dial-base-entity';

interface Props {
  entity: DialBaseEntity;
  onChangeEntity: (entity: DialBaseEntity) => void;
}

const EntityAttachments: FC<Props> = ({ entity, onChangeEntity }) => {
  const t = useI18n();

  const [attachmentError, setAttachmentError] = useState<string | undefined>();

  const onChangeAttachmentMax = useCallback(
    (value: number | string) => {
      if (Number(value) > MAX_ATTACHMENTS_LIMIT) {
        setAttachmentError(t(AttachmentsI18nKey.AttachmentsMaxNumberError, { max: MAX_ATTACHMENTS_LIMIT }));
      } else {
        setAttachmentError(void 0);
      }
      onChangeEntity({ ...entity, maxInputAttachments: value });
    },
    [entity, onChangeEntity, t],
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
        setAttachmentError(void 0);
      }
    },
    [entity, onChangeEntity],
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      <AttachmentInput
        initialValues={entity.inputAttachmentTypes}
        fieldTitle={t(AttachmentsI18nKey.Attachments)}
        placeholder={t(AttachmentsI18nKey.EnterAttachmentsTypes)}
        allValueLabel={t(ButtonsI18nKey.UseAllAttachment)}
        availableItems={mimeMapping}
        inputClass="lg:w-[35%]"
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
            errorText={attachmentError}
            invalid={!!attachmentError}
            min={0}
          />
        </div>
      )}
    </div>
  );
};

export default EntityAttachments;
