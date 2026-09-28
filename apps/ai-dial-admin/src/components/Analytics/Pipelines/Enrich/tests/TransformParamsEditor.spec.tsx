import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, test } from 'vitest';

import TransformParamsEditor from '@/src/components/Analytics/Pipelines/Enrich/TransformParamsEditor';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';

const Host = ({ seed = {} }: { seed?: Record<string, unknown> }) => {
  const [params, setParams] = useState<Record<string, unknown>>(seed);
  return <TransformParamsEditor params={params} onChange={setParams} />;
};

const addRow = () => fireEvent.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.AddParam }));
const keyFields = () => screen.getAllByLabelText(AnalyticsPipelinesI18nKey.ParamKey, { exact: false });

describe('TransformParamsEditor', () => {
  test('states that a transform carrying no params has none set', () => {
    render(<Host />);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.NoParams)).toBeTruthy();
  });

  test('publishes an entry as a number where the value round-trips as one', () => {
    const onChange = vi.fn();
    render(<TransformParamsEditor params={{}} onChange={onChange} />);

    addRow();
    fireEvent.change(keyFields()[0], { target: { value: 'max_tokens' } });
    fireEvent.change(screen.getAllByLabelText(AnalyticsPipelinesI18nKey.ParamValue, { exact: false })[0], {
      target: { value: '512' },
    });

    expect(onChange).toHaveBeenLastCalledWith({ max_tokens: 512 });
  });

  // A row id derived from the list length repeats after a delete, and two rows sharing one are patched
  // together — a keystroke in either would land in both.
  test('keeps row ids distinct across a delete, so one row is edited at a time', () => {
    render(<Host />);

    addRow();
    addRow();
    fireEvent.change(keyFields()[0], { target: { value: 'first' } });
    fireEvent.click(screen.getAllByRole('button', { name: /Buttons.Delete/ })[0]);
    addRow();

    fireEvent.change(keyFields()[0], { target: { value: 'kept' } });

    expect((keyFields()[1] as HTMLInputElement).value).toBe('');
  });
});
