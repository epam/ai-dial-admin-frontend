'use client';

import { FC, useMemo, useState } from 'react';
import { DialNoDataContent, DialSearch } from '@epam/ai-dial-ui-kit';

import { DeploymentsI18nKey } from '@/src/constants/i18n';
import { NodePool } from '@/src/models/deployments/node-pools';
import { useI18n } from '@/src/locales/client';

import NodePoolItem from '@/src/components/Deployments/NodePool/NodePoolItem';

const RADIO_NAME = 'node-pool-selector';
const ANY_VALUE = '__any__';

const matchesQuery = (pool: NodePool, query: string): boolean => {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    pool.id.toLowerCase().includes(q) ||
    pool.name.toLowerCase().includes(q) ||
    (pool.description?.toLowerCase().includes(q) ?? false)
  );
};

interface Props {
  pools: NodePool[];
  selectedId: string | null;
  onSelect: (poolId: string | null) => void;
}

const NodePoolList: FC<Props> = ({ pools, selectedId, onSelect }) => {
  const t = useI18n();
  const [search, setSearch] = useState('');

  const filteredPools = useMemo(() => pools.filter((pool) => matchesQuery(pool, search.trim())), [pools, search]);

  const onItemSelect = (value: string) => {
    onSelect(value === ANY_VALUE ? null : value);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <DialSearch
        id="node-pool-search"
        value={search}
        onChange={setSearch}
        placeholder={t(DeploymentsI18nKey.NodePoolSearchPlaceholder)}
      />
      <div className="flex flex-1 flex-col overflow-hidden rounded border border-primary">
        <div className="grid grid-cols-[36px_1fr_1.5fr] gap-3 items-center px-4 py-2.5 bg-layer-3 border-b border-primary dial-tiny-semi-text uppercase tracking-wide text-secondary">
          <span />
          <span>{t(DeploymentsI18nKey.NodePoolColumnName)}</span>
          <span>{t(DeploymentsI18nKey.NodePoolColumnDescription)}</span>
        </div>
        <ul className="flex flex-col overflow-auto">
          <NodePoolItem
            radioName={RADIO_NAME}
            inputId={`node-pool-${ANY_VALUE}`}
            value={ANY_VALUE}
            name={t(DeploymentsI18nKey.NodePoolAny)}
            description={t(DeploymentsI18nKey.NodePoolAnyDescription)}
            checked={selectedId === null}
            onSelect={onItemSelect}
          />
          {filteredPools.length === 0 && pools.length > 0 ? (
            <li className="flex items-center justify-center py-10">
              <DialNoDataContent title={t(DeploymentsI18nKey.NodePoolNoMatches)} />
            </li>
          ) : (
            filteredPools.map((pool) => (
              <NodePoolItem
                key={pool.id}
                radioName={RADIO_NAME}
                inputId={`node-pool-${pool.id}`}
                value={pool.id}
                name={pool.name}
                description={pool.description}
                poolId={pool.id}
                checked={selectedId === pool.id}
                onSelect={onItemSelect}
              />
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default NodePoolList;
