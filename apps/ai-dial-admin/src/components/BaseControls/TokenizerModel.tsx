'use client';

import { DialInput } from '@epam/ai-dial-ui-kit';
import { useCallback } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';

interface Props<T> {
  entity: T;
  onChangeEntity: (entity: T) => void;
}

/**
 * Free text, with no catalogue behind it.
 *
 * DIAL Core treats `tokenizerModel` as an opaque pass-through: `ModelController` copies it into the
 * `/v1/models` listing and nothing in Core resolves, validates or enumerates it. The list of ids exists
 * only in the admin backend, so the entity surfaces' selection-only picker would make this field
 * uneditable whenever that backend is down — unacceptable on a surface whose data path is Core-only.
 * Nothing validates the value at any layer, here or in Core.
 */
const TokenizerModelControl = <T extends { tokenizerModel?: string }>({ entity, onChangeEntity }: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const onChange = useCallback(
    (value?: string) => {
      const next = { ...entity };

      // Absent, not empty. Core stores `''` verbatim and republishes it, leaving a model whose
      // tokenizer is the empty string rather than unset.
      if (value) {
        next.tokenizerModel = value;
      } else {
        delete next.tokenizerModel;
      }

      onChangeEntity(next);
    },
    [entity, onChangeEntity],
  );

  return (
    <DialInput
      id="tokenizerModel"
      containerClassName={STANDARD_CONTROL_WIDTH}
      labelProps={{ label: t(EntityFieldsI18nKey.tokenizerModel) }}
      placeholder={t(EntityPlaceholdersI18nKey.TokenizerModel)}
      value={entity.tokenizerModel ?? ''}
      onChange={onChange}
      disabled={isReadOnlyAdmin}
    />
  );
};

export default TokenizerModelControl;
