import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import TryOutRequestTabs from '../components/TryOutRequestTabs';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialTabs: ({
    tabs,
    activeTab,
    onClick,
  }: {
    tabs: { id: string; label: string }[];
    activeTab: string;
    onClick: (id: string) => void;
  }) => (
    <div>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activeTab}
          onClick={() => onClick(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  ),
}));

const baseSuite: TestSuite = {
  suiteType: SuiteType.Deployment,
  additionalRequests: [{}, {}],
};

describe('TryOutRequestTabs', () => {
  test('renders numbered request tabs when requests are unnamed', () => {
    const onSelect = vi.fn();

    render(<TryOutRequestTabs testSuite={baseSuite} selectedIndex={0} onSelect={onSelect} />);

    expect(screen.getByRole('tab', { name: '1. TestSuites.Request' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '2. TestSuites.Request' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '3. TestSuites.Request' })).toBeInTheDocument();
  });

  test('renders named request tabs when request names are set', () => {
    const namedSuite: TestSuite = {
      suiteType: SuiteType.Deployment,
      requestName: 'Main',
      additionalRequests: [{ name: 'Follow-up' }],
    };

    render(<TryOutRequestTabs testSuite={namedSuite} selectedIndex={1} onSelect={vi.fn()} />);

    expect(screen.getByRole('tab', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Follow-up' })).toHaveAttribute('aria-selected', 'true');
  });

  test('calls onSelect with the clicked request index', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<TryOutRequestTabs testSuite={baseSuite} selectedIndex={0} onSelect={onSelect} />);

    await user.click(screen.getByRole('tab', { name: '2. TestSuites.Request' }));

    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
