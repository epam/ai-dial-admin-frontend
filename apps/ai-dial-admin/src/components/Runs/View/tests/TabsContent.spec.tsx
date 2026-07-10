import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';
import { createDefaultRunViewTabState } from '../use-run-view-tab-state';

vi.mock('../../Summary/SummaryTab', () => ({
  default: ({ run }: any) => <div role="region" aria-label="summary-tab" data-run={run?.id} />,
}));

vi.mock('../ExtractionResult', () => ({
  default: ({ run }: any) => <div role="region" aria-label="extraction-result-tab" data-run={run?.id} />,
}));

const run = { id: 'run-1' } as any;

const createTabState = () => ({
  state: createDefaultRunViewTabState(),
  setSummaryState: vi.fn(),
  setExtractionResultState: vi.fn(),
  resetSummarySelections: vi.fn(),
});

describe('Runs View :: TabsContent', () => {
  test('renders SummaryTab for the Summary tab', () => {
    render(<TabsContent activeTab={EntityViewTab.Summary} run={run} tabState={createTabState()} />);

    expect(screen.getByRole('region', { name: 'summary-tab' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'extraction-result-tab' })).not.toBeInTheDocument();
  });

  test('renders ExtractionResultTab for the ExtractionResult tab', () => {
    render(<TabsContent activeTab={EntityViewTab.ExtractionResult} run={run} tabState={createTabState()} />);

    expect(screen.getByRole('region', { name: 'extraction-result-tab' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'summary-tab' })).not.toBeInTheDocument();
  });
});
