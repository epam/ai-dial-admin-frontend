'use client';

import classNames from 'classnames';
import { FC, useCallback, useEffect, useState } from 'react';
import { ButtonAppearance, DialLoader, DialNoDataContent, DialPrimaryButton } from '@epam/ai-dial-ui-kit';

import { getNodePools } from '@/src/app/actions/deployments';
import { ButtonsI18nKey, DeploymentsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import { NodePool } from '@/src/models/deployments/node-pools';
import { humanBytes, humanMilliCpus, isGpuPool } from '@/src/utils/deployments/node-pools';
import { isEditDisabled } from '@/src/utils/deployments/containers';
import { useI18n } from '@/src/locales/client';

import NodePoolSelectorModal from '@/src/components/Deployments/Fields/ContainerNodePool/NodePoolSelectorModal';

interface SummaryProps {
  pool: NodePool;
}

const SelectedPoolSummary: FC<SummaryProps> = ({ pool }) => {
  const t = useI18n();
  const isGpu = isGpuPool(pool);
  const accelerator = pool.gpu ? `${pool.gpu.count}× ${pool.gpu.name}` : t(DeploymentsI18nKey.NodePoolCpuOnly);

  return (
    <div className="flex flex-1 items-center gap-3 min-w-0">
      <span
        aria-hidden
        className={classNames('size-2 rounded-full shrink-0', isGpu ? 'bg-accent-tertiary' : 'bg-accent-secondary')}
      />
      <div className="flex flex-col min-w-0">
        <span className="font-mono font-semibold text-primary truncate" title={pool.name}>
          {pool.name}
        </span>
        <span className="text-xs text-secondary tabular-nums">
          {accelerator} · {humanMilliCpus(pool.cpu.milliCpus)} · {humanBytes(pool.memory.bytes)} · {pool.minNodes}–
          {pool.maxNodes} {t(DeploymentsI18nKey.NodePoolUnitNodes)}
        </span>
      </div>
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

  const selectedName = container.nodePool ?? null;

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    getNodePools()
      .then(({ success, response, errorMessage: message }) => {
        if (!isActive) return;
        if (success) {
          setPools(Array.isArray(response) ? (response as NodePool[]) : []);
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

  const selectedPool = pools.find((pool) => pool.name === selectedName) ?? null;

  const onConfirmSelection = useCallback(
    (name: string | null) => {
      setContainer({ ...container, nodePool: name ?? undefined });
    },
    [container, setContainer],
  );

  const onClearSelection = useCallback(() => {
    setContainer({ ...container, nodePool: undefined });
  }, [container, setContainer]);

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
  } else if (pools.length === 0) {
    body = <DialNoDataContent title={t(DeploymentsI18nKey.NodePoolEmpty)} />;
  } else {
    body = (
      <div className="flex items-center gap-3 rounded border border-primary px-4 py-3">
        {selectedPool ? (
          <SelectedPoolSummary pool={selectedPool} />
        ) : selectedName ? (
          <span className="flex-1 text-sm text-secondary font-mono">{selectedName}</span>
        ) : (
          <span className="flex-1 text-sm text-secondary">{t(DeploymentsI18nKey.NodePoolNotSelected)}</span>
        )}
        <DialPrimaryButton
          appearance={ButtonAppearance.Ghost}
          label={selectedName ? t(ButtonsI18nKey.Change) : t(DeploymentsI18nKey.NodePoolSelect)}
          onClick={onOpenModal}
          disabled={isDisabled}
        />
        {selectedName && (
          <DialPrimaryButton
            appearance={ButtonAppearance.Link}
            label={t(ButtonsI18nKey.Remove)}
            onClick={onClearSelection}
            disabled={isDisabled}
          />
        )}
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
        initialSelection={selectedName}
        onClose={onCloseModal}
        onConfirm={onConfirmSelection}
      />
    </div>
  );
};

export default ContainerNodePool;
