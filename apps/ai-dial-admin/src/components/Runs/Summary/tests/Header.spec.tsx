import { render, screen, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { RunsI18nKey } from '@/src/constants/i18n';
import { Run } from '@/src/models/evaluation/run';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import Header from '../Header';

vi.mock('@/src/components/Common/LabelledText/LabelledText', () => ({
  default: ({ label, text, children }: any) => (
    <div role="region" aria-label="labelled-text">
      <div role="region" aria-label="label">
        {label}
      </div>
      {text && (
        <div role="region" aria-label="text">
          {text}
        </div>
      )}
      {children && (
        <div role="region" aria-label="children">
          {children}
        </div>
      )}
    </div>
  ),
}));

const baseRun: Run = {};

const getChainRow = () =>
  screen
    .queryAllByRole('region', { name: 'labelled-text' })
    .find((row) => within(row).queryByRole('region', { name: 'label' })?.textContent === RunsI18nKey.RequestsInChain);

describe('Runs Summary :: Header', () => {
  test('omits the chain-size row when the suite has no additional requests', () => {
    render(<Header run={baseRun} testSuite={{}} />);

    expect(getChainRow()).toBeUndefined();
  });

  test('omits the chain-size row when additionalRequests is an empty array', () => {
    const run: Run = { suiteSnapshot: { additionalRequests: [] } };
    render(<Header run={run} testSuite={{}} />);

    expect(getChainRow()).toBeUndefined();
  });

  test('shows the chain-size row as 1 plus the additional-request count', () => {
    const run: Run = { suiteSnapshot: { additionalRequests: [{}, {}] } };
    render(<Header run={run} testSuite={{}} />);

    const row = getChainRow();
    expect(row).toBeTruthy();
    expect(within(row!).getByRole('region', { name: 'text' }).textContent).toBe('3');
  });

  test('reads the chain size from the run snapshot, not the live suite', () => {
    const run: Run = { suiteSnapshot: { additionalRequests: [{}] } };
    const testSuite: TestSuite = { additionalRequests: [{}, {}, {}] };
    render(<Header run={run} testSuite={testSuite} />);

    const row = getChainRow();
    expect(within(row!).getByRole('region', { name: 'text' }).textContent).toBe('2');
  });

  test('falls back to the live suite when the run has no snapshot', () => {
    const testSuite: TestSuite = { additionalRequests: [{}] };
    render(<Header run={baseRun} testSuite={testSuite} />);

    const row = getChainRow();
    expect(within(row!).getByRole('region', { name: 'text' }).textContent).toBe('2');
  });
});
