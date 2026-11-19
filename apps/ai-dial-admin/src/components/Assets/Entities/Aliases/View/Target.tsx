'use client';

import { FC, useCallback } from 'react';

import KeyValueGrid from '@/src/components/Common/KeyValueGrid/KeyValueGrid';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialAliasResource } from '@/src/models/dial/alias';
import { applyAliasTargetChange, canAliasHaveDefaultHeaders } from '@/src/utils/aliases/default-headers';
import TargetField, { AliasTargetChange } from '../TargetField';

interface Props {
  asset: DialAliasResource;
  isPublic?: boolean;
  onChange: (asset: DialAliasResource) => void;
}

/** Target tab of an alias: what it forwards to and the type it is presented as. */
const AliasTargetTab: FC<Props> = ({ asset, isPublic, onChange }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const onChangeTarget = useCallback(
    (change: AliasTargetChange) => onChange(applyAliasTargetChange(asset, change)),
    [asset, onChange],
  );

  return (
    <div className="flex flex-col gap-y-8">
      <TargetField
        target={asset.target}
        presentAs={asset.presentAs}
        isPublic={isPublic}
        isReadOnly={isReadOnlyAdmin}
        onChange={onChangeTarget}
      />
      {canAliasHaveDefaultHeaders(asset) && (
        <KeyValueGrid
          label={t(EntityFieldsI18nKey.defaultHeaders)}
          value={asset.defaultHeaders}
          onChange={(defaultHeaders) => onChange({ ...asset, defaultHeaders })}
        />
      )}
    </div>
  );
};

export default AliasTargetTab;
