'use client';

import { FC } from 'react';

import { ElementSize, Search, Select } from '@epam/ai-dial-ui-kit';

import { GROUP_STATE_LABEL_KEY, GROUP_STATE_ORDER } from '@/src/components/Analytics/Pipelines/Groups/constants';
import { GroupState } from '@/src/components/Analytics/Pipelines/Groups/models';
import { PIPELINE_SELECT_DEFAULTS } from '@/src/constants/analytics/pipelines';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

/** The select's own value for "every state", since a select has no empty option. */
const EVERY_STATE = 'all';

interface Props {
  search: string;
  state?: GroupState;
  onSearchChange: (term: string) => void;
  onStateChange: (state?: GroupState) => void;
}

/** The grid's two filters. Both narrow the rows already read; neither issues a request. */
const GroupsFilterBar: FC<Props> = ({ search, state, onSearchChange, onStateChange }) => {
  const t = useI18n();

  const stateOptions = [
    { value: EVERY_STATE, label: t(AnalyticsPipelinesI18nKey.GroupsStateAll) },
    ...GROUP_STATE_ORDER.map((value) => ({ value, label: t(GROUP_STATE_LABEL_KEY[value]) })),
  ];

  return (
    <div className="flex flex-row flex-wrap items-center gap-3">
      <Search
        containerClassName="w-[260px]"
        size={ElementSize.Small}
        aria-label={t(AnalyticsPipelinesI18nKey.GroupsSearch)}
        placeholder={t(AnalyticsPipelinesI18nKey.GroupsSearch)}
        clearLabel={t(AnalyticsPipelinesI18nKey.GroupsClearSearch)}
        value={search}
        onChange={(value) => onSearchChange(value ?? '')}
      />
      <Select
        {...PIPELINE_SELECT_DEFAULTS}
        className="w-[180px]"
        size={ElementSize.Small}
        ariaLabel={t(AnalyticsPipelinesI18nKey.GroupsStateFilter)}
        options={stateOptions}
        value={state ?? EVERY_STATE}
        onChange={(value) => onStateChange(value === EVERY_STATE ? undefined : (value as GroupState))}
      />
    </div>
  );
};

export default GroupsFilterBar;
