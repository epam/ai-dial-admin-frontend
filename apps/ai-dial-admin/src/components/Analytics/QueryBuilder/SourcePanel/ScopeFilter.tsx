'use client';

import { FC } from 'react';

import { Dropdown, ElementSize, GhostIconButton, MenuItemMark } from '@epam/ai-dial-ui-kit';
import type { DropdownItem } from '@epam/ai-dial-ui-kit';
import { IconFilter2 } from '@tabler/icons-react';

import { useSourcePanel } from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { QueryScopeFilter } from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';
import { QueriesI18nKey, QuerySourcePanelI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const SCOPE_FILTER_I18N: Record<QueryScopeFilter, QuerySourcePanelI18nKey | QueriesI18nKey> = {
  [QueryScopeFilter.All]: QuerySourcePanelI18nKey.ScopeAll,
  [QueryScopeFilter.Personal]: QueriesI18nKey.ScopePersonal,
  [QueryScopeFilter.Common]: QueriesI18nKey.ScopeCommon,
};

const ScopeFilter: FC = () => {
  const t = useI18n();
  const { scopeFilter, onChangeScopeFilter } = useSourcePanel();

  const isActive = scopeFilter !== QueryScopeFilter.All;
  const label = isActive
    ? t(QuerySourcePanelI18nKey.ScopeFilterActive, { scope: t(SCOPE_FILTER_I18N[scopeFilter]) })
    : t(QuerySourcePanelI18nKey.ScopeFilter);

  const items: DropdownItem[] = Object.values(QueryScopeFilter).map((scope) => ({
    key: scope,
    label: t(SCOPE_FILTER_I18N[scope]),
    mark: MenuItemMark.Check,
    checked: scope === scopeFilter,
    onClick: () => onChangeScopeFilter(scope),
  }));

  return (
    <Dropdown items={items} matchReferenceWidth={false} placement="bottom-end">
      <GhostIconButton
        size={ElementSize.Small}
        aria-label={label}
        icon={
          <span className="relative flex">
            <IconFilter2 size={16} aria-hidden />
            {isActive && <span className="absolute -right-1 -top-1 size-1.5 rounded-full bg-control-accent" />}
          </span>
        }
      />
    </Dropdown>
  );
};

export default ScopeFilter;
