'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { DialNumberInput } from '@epam/ai-dial-ui-kit';

import AttachmentInput from '@/src/components/Common/AttachmentInput/AttachmentInput';
import { AttachmentsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getMaxAttachmentError } from '@/src/utils/validation/get-max-attachment-error';
import { mimeMapping } from './constants';

interface Props<T> {
  entity: T;
  onChangeEntity: (entity: T) => void;
  isAsset?: boolean;
}

const EntityAttachments = <T extends object>({ entity, onChangeEntity, isAsset }: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const maxAttachmentsKey = isAsset ? 'max_input_attachments' : 'maxInputAttachments';
  const attachmentTypesKey = isAsset ? 'input_attachment_types' : 'inputAttachmentTypes';

  const record = entity as Record<string, unknown>;
  const maxInputAttachments = record[maxAttachmentsKey] as number | string | undefined;
  const inputAttachmentTypes = record[attachmentTypesKey] as string[] | undefined;

  const { dispatch } = useSaveValidationContext();
  const error = useMemo(() => {
    return getMaxAttachmentError(maxInputAttachments, t);
  }, [t, maxInputAttachments]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'maxRetryAttempts', isValid: !error });
  }, [error, t, dispatch]);

  const onChangeAttachmentMax = useCallback(
    (value?: number | string) => {
      onChangeEntity({ ...entity, [maxAttachmentsKey]: value } as T);
    },
    [entity, onChangeEntity, maxAttachmentsKey],
  );

  const onChangeAttachmentTypes = useCallback(
    (types?: string[]) => {
      if (types) {
        onChangeEntity({ ...entity, [attachmentTypesKey]: types } as T);
      } else {
        onChangeEntity({
          ...entity,
          [maxAttachmentsKey]: void 0,
          [attachmentTypesKey]: void 0,
        } as T);
      }
    },
    [entity, onChangeEntity, maxAttachmentsKey, attachmentTypesKey],
  );

  return (
    <div className="flex flex-col gap-y-8">
      <AttachmentInput
        initialValues={inputAttachmentTypes}
        label={t(AttachmentsI18nKey.Attachments)}
        placeholder={t(EntityPlaceholdersI18nKey.AttachmentsTypes)}
        availableItems={mimeMapping}
        onChange={(values) => onChangeAttachmentTypes(values)}
      />
      {!!inputAttachmentTypes?.length && (
        <DialNumberInput
          containerClassName="w-[180px]"
          disabled={isReadOnlyAdmin}
          id="maxAttachment"
          labelProps={{ label: t(AttachmentsI18nKey.MaxNumber) }}
          placeholder={t(EntityPlaceholdersI18nKey.Number)}
          value={maxInputAttachments}
          onChange={onChangeAttachmentMax}
          error={error}
          invalid={!!error}
          min={0}
        />
      )}
    </div>
  );
};

export default EntityAttachments;
