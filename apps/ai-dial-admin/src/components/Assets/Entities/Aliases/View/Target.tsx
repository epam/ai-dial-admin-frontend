'use client';

import { FC, useCallback } from 'react';

import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { DialAliasResource } from '@/src/models/dial/alias';
import TargetField, { AliasTargetChange } from '../TargetField';

interface Props {
  asset: DialAliasResource;
  isPublic?: boolean;
  onChange: (asset: DialAliasResource) => void;
}

/** Target tab of an alias: what it forwards to and the type it is presented as. */
const AliasTargetTab: FC<Props> = ({ asset, isPublic, onChange }) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const onChangeTarget = useCallback(
    ({ target, presentAs }: AliasTargetChange) => onChange({ ...asset, target, presentAs }),
    [asset, onChange],
  );

  return (
    <TargetField
      target={asset.target}
      presentAs={asset.presentAs}
      isPublic={isPublic}
      isReadOnly={isReadOnlyAdmin}
      onChange={onChangeTarget}
    />
  );
};

export default AliasTargetTab;
