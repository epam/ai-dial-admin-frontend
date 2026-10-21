import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ReadinessSummary from '@/src/components/Analytics/Pipelines/Groups/ReadinessSummary';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';

const list = () => screen.getAllByRole('list');

describe('ReadinessSummary', () => {
  test('lists every declared trigger under its description, and the ceiling as a limit', () => {
    render(
      <ReadinessSummary
        readyWhen={{ idle: '10m', signal: "event_kind = 'done'", max_staleness: '24h', cost_ceiling: 20 }}
      />,
    );

    expect(screen.getByText(AnalyticsPipelinesI18nKey.GroupsTriggersDescription)).toBeInTheDocument();

    const [triggers, limits] = list();
    expect(within(triggers).getAllByRole('listitem')).toHaveLength(3);
    expect(within(triggers).getByText(AnalyticsPipelinesI18nKey.GroupsConditionIdle)).toBeInTheDocument();
    expect(within(triggers).getByText("event_kind = 'done'")).toBeInTheDocument();
    expect(within(triggers).getByText(AnalyticsPipelinesI18nKey.GroupsConditionStaleness)).toBeInTheDocument();
    expect(
      within(limits).getByText(AnalyticsPipelinesI18nKey.GroupsConditionCeiling, { exact: false }),
    ).toBeInTheDocument();
  });

  test('shows the default idle for a signal-only pipeline and no limits without a ceiling', () => {
    render(<ReadinessSummary readyWhen={{ signal: 'x = 1' }} />);

    expect(list()).toHaveLength(1);
    expect(screen.getByText(AnalyticsPipelinesI18nKey.GroupsConditionDefaultIdle)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.GroupsLimitsTitle)).toBeNull();
  });
});
