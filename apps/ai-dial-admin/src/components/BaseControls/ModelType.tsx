'use client';

import { DialSelectField } from '@epam/ai-dial-ui-kit';
import { useCallback, useMemo } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialModelResourceType } from '@/src/models/dial/resource';

interface Props<T> {
  entity: T;
  onChangeEntity: (entity: T) => void;
}

/**
 * Typed to `DialModelResourceType` — Core's wire enum (`CHAT`/`COMPLETION`/`EMBEDDING`) — deliberately,
 * not the entity-side `DialModelType`, which is a different set (lowercase, and no `COMPLETION`).
 *
 * `Entities > Models` never surfaces `type` at all: it is set programmatically, defaulting to chat on
 * save. A Core model resource has no container or adapter to infer it from, so without this control
 * every asset model would be stuck as a chat model and an embedding model would be unbuildable here.
 */
const ModelTypeControl = <T extends { type?: DialModelResourceType }>({ entity, onChangeEntity }: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const options = useMemo(() => Object.values(DialModelResourceType).map((value) => ({ value, label: value })), []);

  const onChange = useCallback(
    (value: string | string[]) => {
      onChangeEntity({ ...entity, type: value as DialModelResourceType });
    },
    [entity, onChangeEntity],
  );

  return (
    <DialSelectField
      id="modelType"
      label={t(EntityFieldsI18nKey.type)}
      placeholder={t(EntityPlaceholdersI18nKey.Type)}
      value={entity.type}
      options={options}
      onChange={onChange}
      containerClassName={STANDARD_CONTROL_WIDTH}
      disabled={isReadOnlyAdmin}
    />
  );
};

export default ModelTypeControl;
