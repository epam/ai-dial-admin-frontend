import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import ReadyWhenEditor from '@/src/components/Analytics/Pipelines/Enrich/ReadyWhenEditor';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { ReadyWhen } from '@/src/models/analytics/pipeline';

const Host = ({ seed }: { seed?: ReadyWhen }) => {
  const [readyWhen, setReadyWhen] = useState<ReadyWhen | undefined>(seed);
  return (
    <ReadyWhenEditor
      readyWhen={readyWhen}
      isCostCeilingValid
      hasCondition={Boolean(readyWhen?.idle || readyWhen?.signal || readyWhen?.max_staleness)}
      onChange={setReadyWhen}
    />
  );
};

const idleCheckbox = () => screen.getByRole('checkbox', { name: AnalyticsPipelinesI18nKey.ReadyWhenIdleLabel });
const stalenessCheckbox = () =>
  screen.getByRole('checkbox', { name: AnalyticsPipelinesI18nKey.ReadyWhenStalenessLabel });

describe('ReadyWhenEditor', () => {
  test('presents three independently enabled conditions', () => {
    render(<Host />);

    expect(idleCheckbox()).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: AnalyticsPipelinesI18nKey.ReadyWhenSignalLabel })).toBeTruthy();
    expect(stalenessCheckbox()).toBeTruthy();
  });

  test('checks the conditions the declaration already carries', () => {
    render(<Host seed={{ idle: '10m' }} />);

    expect(idleCheckbox()).toBeChecked();
    expect(stalenessCheckbox()).not.toBeChecked();
  });

  test('states that at least one condition is required while none is enabled', () => {
    render(<Host />);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.ReadyWhenRequired)).toBeTruthy();
  });

  test('keeps the entered value on screen when the condition is switched off, and sends it no more', () => {
    const onChange = vi.fn();
    render(<ReadyWhenEditor readyWhen={{ idle: '10m' }} isCostCeilingValid hasCondition onChange={onChange} />);

    fireEvent.click(idleCheckbox());

    // The member is dropped from the request while what was entered stays on screen, so switching the
    // condition back on does not mean retyping it.
    expect(onChange).toHaveBeenCalledWith({});
    expect(screen.getByText('10m')).toBeTruthy();
  });

  test('presents the predicate only once its condition is enabled', () => {
    render(<Host seed={{ signal: "event_kind = 'end'" }} />);

    expect(screen.getByLabelText(AnalyticsPipelinesI18nKey.ReadyWhenSignal)).toBeTruthy();
  });

  test('offers the cost ceiling apart from the three conditions', () => {
    render(<Host />);

    expect(screen.getByLabelText(AnalyticsPipelinesI18nKey.CostCeilingLabel, { exact: false })).toBeTruthy();
  });
});
