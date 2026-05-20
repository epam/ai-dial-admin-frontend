'use client';

import { FC } from 'react';

import { DeploymentsI18nKey } from '@/src/constants/i18n';
import { NodePool } from '@/src/models/deployments/node-pools';
import { useI18n } from '@/src/locales/client';

import NodePoolInfo from '@/src/components/Deployments/NodePool/NodePoolInfo';

interface Props {
  pool: NodePool | null;
  poolId: string | null;
  poolName: string | null;
}

const SelectedPoolDisplay: FC<Props> = ({ pool, poolId, poolName }) => {
  const t = useI18n();

  if (!poolId) {
    return (
      <NodePoolInfo
        className="flex-1"
        name={t(DeploymentsI18nKey.NodePoolAny)}
        caption={t(DeploymentsI18nKey.NodePoolAnyDescription)}
      />
    );
  }

  const resolvedName = pool?.name ?? poolName ?? null;

  if (!resolvedName) {
    return (
      <NodePoolInfo
        className="flex-1"
        name={t(DeploymentsI18nKey.NodePoolUnknown, { id: poolId })}
        caption={t(DeploymentsI18nKey.NodePoolUnknownHint)}
        isError
      />
    );
  }

  return <NodePoolInfo className="flex-1" name={resolvedName} poolId={poolId} caption={pool?.description} />;
};

export default SelectedPoolDisplay;
