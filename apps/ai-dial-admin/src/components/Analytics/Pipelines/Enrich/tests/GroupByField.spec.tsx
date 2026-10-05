import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import GroupByField from '@/src/components/Analytics/Pipelines/Enrich/GroupByField';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';

const renderField = (props?: Partial<Parameters<typeof GroupByField>[0]>) =>
  render(<GroupByField grainKey="client_session_id" onChange={vi.fn()} {...props} />);

// The 2.0 label spells the required marker out in the accessible name, where 1.0 used an asterisk.
const field = () => screen.getByRole('textbox', { name: `${AnalyticsPipelinesI18nKey.GroupBy}(required)` });

describe('GroupByField', () => {
  test('offers the target grain key as the starting value, under its own label', () => {
    renderField();

    expect(field()).toHaveValue('client_session_id');
  });

  test('presents the declared value over the default', () => {
    renderField({ value: 'usage_client_identity.client_session_id' });

    expect(screen.getByRole('textbox')).toHaveValue('usage_client_identity.client_session_id');
  });

  // The service takes a qualified spelling where the source reaches the key through an enrichment, and
  // there is no list the console can be sure of — so anything can be typed rather than nothing.
  test('accepts any text the author types', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ onChange });

    await user.type(screen.getByRole('textbox'), 'x');

    expect(onChange).toHaveBeenCalledWith('client_session_idx');
  });

  test('is editable rather than disabled when the target has no grain key', () => {
    renderField({ grainKey: undefined });

    const input = screen.getByRole('textbox');

    expect(input).toHaveValue('');
    expect(input).toBeEnabled();
  });
});
