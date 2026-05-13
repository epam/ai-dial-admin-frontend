'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { ButtonAppearance, DialLoader, DialNoDataContent, DialPrimaryButton } from '@epam/ai-dial-ui-kit';

import { getNodePools } from '@/src/app/actions/deployments';
import { ButtonsI18nKey, DeploymentsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import { NodePool } from '@/src/models/deployments/node-pools';
import { isEditDisabled } from '@/src/utils/deployments/containers';
import { useI18n } from '@/src/locales/client';

import NodePoolSelectorModal from '@/src/components/Deployments/Fields/ContainerNodePool/NodePoolSelectorModal';

interface SelectedDisplayProps {
  pool: NodePool | null;
  poolId: string | null;
  poolName: string | null;
}

const SelectedPoolDisplay: FC<SelectedDisplayProps> = ({ pool, poolId, poolName }) => {
  const t = useI18n();

  if (!poolId) {
    return (
      <div className="flex flex-1 flex-col min-w-0">
        <span className="font-semibold text-primary truncate">{t(DeploymentsI18nKey.NodePoolAny)}</span>
        <span className="text-xs text-secondary truncate">{t(DeploymentsI18nKey.NodePoolAnyDescription)}</span>
      </div>
    );
  }

  const resolvedName = pool?.name ?? poolName ?? null;
  const description = pool?.description;

  if (!resolvedName) {
    return (
      <div className="flex flex-1 flex-col min-w-0">
        <span className="font-semibold text-error truncate" title={poolId}>
          {t(DeploymentsI18nKey.NodePoolUnknown, { id: poolId })}
        </span>
        <span className="text-xs text-secondary truncate">{t(DeploymentsI18nKey.NodePoolUnknownHint)}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <span className="font-semibold text-primary truncate" title={resolvedName}>
        {resolvedName}
      </span>
      <span className="font-mono text-xs text-secondary truncate" title={poolId}>
        {poolId}
      </span>
      {description && (
        <span className="text-xs text-secondary truncate" title={description}>
          {description}
        </span>
      )}
    </div>
  );
};

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  disabled?: boolean;
}

const ContainerNodePool: FC<Props> = ({ container, setContainer, disabled }) => {
  const t = useI18n();
  const isDisabled = disabled ?? isEditDisabled(container);
  const [pools, setPools] = useState<NodePool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedId = container.nodePoolId ?? null;
  const selectedName = container.nodePoolName ?? null;

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    getNodePools()
      .then(({ success, response, errorMessage: message }) => {
        if (!isActive) return;
        if (success) {
          const list = (response as { pools?: NodePool[] } | undefined)?.pools ?? [];
          setPools(Array.isArray(list) ? list : []);
          setErrorMessage(null);
        } else {
          setPools([]);
          setErrorMessage(message || t(DeploymentsI18nKey.NodePoolLoadError));
        }
      })
      .catch(() => {
        if (!isActive) return;
        setPools([]);
        setErrorMessage(t(DeploymentsI18nKey.NodePoolLoadError));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [t]);

  const selectedPool = pools.find((pool) => pool.id === selectedId) ?? null;

  const onConfirmSelection = useCallback(
    (id: string | null) => {
      const matched = id ? (pools.find((pool) => pool.id === id) ?? null) : null;
      setContainer({
        ...container,
        nodePoolId: id,
        nodePoolName: matched?.name ?? null,
      });
    },
    [container, pools, setContainer],
  );

  const onOpenModal = useCallback(() => setIsModalOpen(true), []);
  const onCloseModal = useCallback(() => setIsModalOpen(false), []);

  let body;
  if (isLoading) {
    body = (
      <div className="flex justify-center py-6">
        <DialLoader size={32} />
      </div>
    );
  } else if (errorMessage) {
    body = <DialNoDataContent title={errorMessage} />;
  } else {
    body = (
      <div className="flex items-center gap-3 rounded border border-primary px-4 py-3">
        <SelectedPoolDisplay pool={selectedPool} poolId={selectedId} poolName={selectedName} />
        <DialPrimaryButton
          appearance={ButtonAppearance.Ghost}
          label={selectedId ? t(ButtonsI18nKey.Change) : t(DeploymentsI18nKey.NodePoolSelect)}
          onClick={onOpenModal}
          disabled={isDisabled || pools.length === 0}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold text-primary">{t(EntityFieldsI18nKey.NodePool)}</h4>
      {body}
      <NodePoolSelectorModal
        isOpen={isModalOpen}
        pools={pools}
        initialSelection={selectedId}
        onClose={onCloseModal}
        onConfirm={onConfirmSelection}
      />
    </div>
  );
};

export default ContainerNodePool;
