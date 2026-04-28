'use client';

import classNames from 'classnames';
import { FC, useEffect, useMemo, useState } from 'react';
import {
  DialNeutralButton,
  DialNoDataContent,
  DialPopup,
  DialPrimaryButton,
  DialRadioButton,
  DialSearch,
  PopupSize,
} from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, DeploymentsI18nKey } from '@/src/constants/i18n';
import { NodePool } from '@/src/models/deployments/node-pools';
import { humanBytes, humanMilliCpus, isGpuPool } from '@/src/utils/deployments/node-pools';
import { useI18n } from '@/src/locales/client';

const RADIO_NAME = 'node-pool-selector';

const ROW_GRID = 'grid grid-cols-[36px_1.8fr_1fr_0.9fr_0.9fr_0.6fr] gap-3 items-center';

interface Props {
  isOpen: boolean;
  pools: NodePool[];
  initialSelection: string | null;
  onClose: () => void;
  onConfirm: (poolName: string | null) => void;
}

const matchesQuery = (pool: NodePool, query: string): boolean => {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    pool.name.toLowerCase().includes(q) ||
    (pool.description?.toLowerCase().includes(q) ?? false) ||
    (pool.gpu?.name.toLowerCase().includes(q) ?? false) ||
    (pool.instance?.toLowerCase().includes(q) ?? false)
  );
};

interface RowProps {
  pool: NodePool;
  checked: boolean;
  onSelect: (name: string) => void;
}

const PoolRow: FC<RowProps> = ({ pool, checked, onSelect }) => {
  const t = useI18n();
  const isGpu = isGpuPool(pool);
  const inputId = `node-pool-${pool.name}`;
  const acceleratorLabel = pool.gpu ? `${pool.gpu.count}× ${pool.gpu.name}` : t(DeploymentsI18nKey.NodePoolCpuOnly);

  return (
    <li
      className={classNames(
        'border-b border-primary last:border-b-0',
        checked ? 'bg-accent-primary-alpha' : 'hover:bg-layer-3',
      )}
    >
      <label htmlFor={inputId} className={classNames(ROW_GRID, 'cursor-pointer px-4 py-3')}>
        <DialRadioButton name={RADIO_NAME} inputId={inputId} value={pool.name} checked={checked} onChange={onSelect} />
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono font-semibold text-primary truncate" title={pool.name}>
              {pool.name}
            </span>
            {pool.instance && (
              <span className="font-mono text-[11px] text-secondary bg-layer-3 rounded px-1.5 py-0.5 truncate">
                {pool.instance}
              </span>
            )}
          </div>
          {pool.description && <span className="text-xs text-secondary truncate">{pool.description}</span>}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden
            className={classNames(
              'size-1.5 rounded-full shrink-0',
              isGpu ? 'bg-accent-tertiary' : 'bg-accent-secondary',
            )}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm text-primary truncate">{acceleratorLabel}</span>
            {pool.gpu && (
              <span className="text-[11px] text-secondary">
                {humanBytes(pool.gpu.vramBytes)} {t(DeploymentsI18nKey.NodePoolUnitVram)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col tabular-nums min-w-0">
          <span className="text-sm text-primary">{humanMilliCpus(pool.cpu.milliCpus)}</span>
          {pool.cpu.name && <span className="text-[11px] text-secondary truncate">{pool.cpu.name}</span>}
        </div>
        <div className="flex flex-col tabular-nums">
          <span className="text-sm text-primary">{humanBytes(pool.memory.bytes)}</span>
          <span className="text-[11px] text-secondary">{t(DeploymentsI18nKey.NodePoolUnitRam)}</span>
        </div>
        <div className="flex flex-col tabular-nums">
          <span className="text-sm text-primary">
            {pool.minNodes}&ndash;{pool.maxNodes}
          </span>
          <span className="text-[11px] text-secondary">{t(DeploymentsI18nKey.NodePoolUnitNodes)}</span>
        </div>
      </label>
    </li>
  );
};

const NodePoolSelectorModal: FC<Props> = ({ isOpen, pools, initialSelection, onClose, onConfirm }) => {
  const t = useI18n();
  const [search, setSearch] = useState('');
  const [pendingSelection, setPendingSelection] = useState<string | null>(initialSelection);

  useEffect(() => {
    if (isOpen) {
      setPendingSelection(initialSelection);
      setSearch('');
    }
  }, [isOpen, initialSelection]);

  const filteredPools = useMemo(() => pools.filter((pool) => matchesQuery(pool, search.trim())), [pools, search]);

  const onApply = () => {
    onConfirm(pendingSelection);
    onClose();
  };

  const emptyTitle = pools.length === 0 ? t(DeploymentsI18nKey.NodePoolEmpty) : t(DeploymentsI18nKey.NodePoolNoMatches);

  return (
    <DialPopup
      open={isOpen}
      onClose={onClose}
      header={t(DeploymentsI18nKey.NodePoolModalTitle)}
      size={PopupSize.Lg}
      className="h-[640px]"
      dividers
      footer={
        <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
          <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
          <DialPrimaryButton label={t(ButtonsI18nKey.Apply)} onClick={onApply} />
        </div>
      }
    >
      <div className="flex h-full flex-col gap-3 px-6 py-4">
        <DialSearch
          id="node-pool-search"
          value={search}
          onChange={setSearch}
          placeholder={t(DeploymentsI18nKey.NodePoolSearchPlaceholder)}
        />
        <div className="flex flex-1 flex-col overflow-hidden rounded border border-primary">
          <div
            className={classNames(
              ROW_GRID,
              'px-4 py-2.5 bg-layer-3 border-b border-primary text-[11px] font-semibold uppercase tracking-wide text-secondary',
            )}
          >
            <span />
            <span>{t(DeploymentsI18nKey.NodePoolColumnName)}</span>
            <span>{t(DeploymentsI18nKey.NodePoolColumnAccelerator)}</span>
            <span>{t(DeploymentsI18nKey.NodePoolColumnCpu)}</span>
            <span>{t(DeploymentsI18nKey.NodePoolColumnMemory)}</span>
            <span>{t(DeploymentsI18nKey.NodePoolColumnNodes)}</span>
          </div>
          {filteredPools.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-10">
              <DialNoDataContent title={emptyTitle} />
            </div>
          ) : (
            <ul className="flex flex-col overflow-auto">
              {filteredPools.map((pool) => (
                <PoolRow
                  key={pool.name}
                  pool={pool}
                  checked={pendingSelection === pool.name}
                  onSelect={setPendingSelection}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </DialPopup>
  );
};

export default NodePoolSelectorModal;
