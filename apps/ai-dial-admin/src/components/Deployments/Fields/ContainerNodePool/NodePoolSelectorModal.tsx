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
import { useI18n } from '@/src/locales/client';

const RADIO_NAME = 'node-pool-selector';
const ANY_VALUE = '__any__';

const ROW_GRID = 'grid grid-cols-[36px_1fr_1.5fr] gap-3 items-center';

interface Props {
  isOpen: boolean;
  pools: NodePool[];
  initialSelection: string | null;
  onClose: () => void;
  onConfirm: (poolId: string | null) => void;
}

const matchesQuery = (pool: NodePool, query: string): boolean => {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    pool.id.toLowerCase().includes(q) ||
    pool.name.toLowerCase().includes(q) ||
    (pool.description?.toLowerCase().includes(q) ?? false)
  );
};

interface RowProps {
  pool: NodePool;
  checked: boolean;
  onSelect: (id: string) => void;
}

const PoolRow: FC<RowProps> = ({ pool, checked, onSelect }) => {
  const inputId = `node-pool-${pool.id}`;

  return (
    <li
      className={classNames(
        'border-b border-primary last:border-b-0',
        checked ? 'bg-accent-primary-alpha' : 'hover:bg-layer-3',
      )}
    >
      <label htmlFor={inputId} className={classNames(ROW_GRID, 'cursor-pointer px-4 py-3')}>
        <DialRadioButton name={RADIO_NAME} inputId={inputId} value={pool.id} checked={checked} onChange={onSelect} />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-semibold text-primary truncate" title={pool.name}>
            {pool.name}
          </span>
          <span className="font-mono text-[11px] text-secondary truncate" title={pool.id}>
            {pool.id}
          </span>
        </div>
        <span className="text-sm text-secondary truncate" title={pool.description || ''}>
          {pool.description || ''}
        </span>
      </label>
    </li>
  );
};

interface AnyRowProps {
  checked: boolean;
  onSelect: () => void;
}

const AnyRow: FC<AnyRowProps> = ({ checked, onSelect }) => {
  const t = useI18n();
  const inputId = `node-pool-${ANY_VALUE}`;

  return (
    <li
      className={classNames(
        'border-b border-primary last:border-b-0',
        checked ? 'bg-accent-primary-alpha' : 'hover:bg-layer-3',
      )}
    >
      <label htmlFor={inputId} className={classNames(ROW_GRID, 'cursor-pointer px-4 py-3')}>
        <DialRadioButton name={RADIO_NAME} inputId={inputId} value={ANY_VALUE} checked={checked} onChange={onSelect} />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-semibold text-primary truncate">{t(DeploymentsI18nKey.NodePoolAny)}</span>
        </div>
        <span className="text-sm text-secondary truncate">{t(DeploymentsI18nKey.NodePoolAnyDescription)}</span>
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

  return (
    <DialPopup
      open={isOpen}
      onClose={onClose}
      header={t(DeploymentsI18nKey.NodePoolModalTitle)}
      size={PopupSize.Lg}
      className="h-[560px]"
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
            <span>{t(DeploymentsI18nKey.NodePoolColumnDescription)}</span>
          </div>
          <ul className="flex flex-col overflow-auto">
            <AnyRow checked={pendingSelection === null} onSelect={() => setPendingSelection(null)} />
            {filteredPools.length === 0 && pools.length > 0 ? (
              <li className="flex items-center justify-center py-10">
                <DialNoDataContent title={t(DeploymentsI18nKey.NodePoolNoMatches)} />
              </li>
            ) : (
              filteredPools.map((pool) => (
                <PoolRow
                  key={pool.id}
                  pool={pool}
                  checked={pendingSelection === pool.id}
                  onSelect={setPendingSelection}
                />
              ))
            )}
          </ul>
        </div>
      </div>
    </DialPopup>
  );
};

export default NodePoolSelectorModal;
