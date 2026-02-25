'use client';

import { FC, useCallback, useEffect, useMemo } from 'react';
import { DialNumberInput } from '@epam/ai-dial-ui-kit';

import AttachmentInput from '@/src/components/Common/AttachmentInput/AttachmentInput';
import { AttachmentsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntityAttachment } from '@/src/models/dial/base-entity';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getMaxAttachmentError } from '@/src/utils/validation/get-max-attachment-error';
import { mimeMapping } from './constants';

interface Props {
  entity: EntityAttachment;
  onChangeEntity: (entity: EntityAttachment) => void;
}

const EntityAttachments: FC<Props> = ({ entity, onChangeEntity }) => {
  const t = useI18n();

  const { dispatch } = useSaveValidationContext();
  const error = useMemo(() => {
    return getMaxAttachmentError(entity.maxInputAttachments, t);
  }, [t, entity.maxInputAttachments]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'maxRetryAttempts', isValid: !error });
  }, [error, t, dispatch]);

  const onChangeAttachmentMax = useCallback(
    (value?: number | string) => {
      onChangeEntity({ ...entity, maxInputAttachments: value });
    },
    [entity, onChangeEntity],
  );

  const onChangeAttachmentTypes = useCallback(
    (types?: string[]) => {
      if (types) {
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
    <div className="flex flex-col gap-y-8">
      <AttachmentInput
        initialValues={entity.inputAttachmentTypes}
        label={t(AttachmentsI18nKey.Attachments)}
        placeholder={t(EntityPlaceholdersI18nKey.AttachmentsTypes)}
        availableItems={mimeMapping}
        onChange={(values) => onChangeAttachmentTypes(values)}
      />
      {!!entity.inputAttachmentTypes?.length && (
        <DialNumberInput
          className="w-[180px]"
          id="maxAttachment"
          labelProps={{ label: t(AttachmentsI18nKey.MaxNumber) }}
          placeholder={t(EntityPlaceholdersI18nKey.Number)}
          value={entity.maxInputAttachments}
          onChange={onChangeAttachmentMax}
          errorText={error}
          invalid={!!error}
          min={0}
        />
      )}
    </div>
  );
};

export default EntityAttachments;
