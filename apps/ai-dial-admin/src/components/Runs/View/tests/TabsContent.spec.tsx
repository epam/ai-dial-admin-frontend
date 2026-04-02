import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('../ExtractionResult', () => ({
  default: ({ run }: any) => (
    <div role="region" aria-label="extraction-result-tab">
      run-id:{run?.id}
    </div>
  ),
}));

vi.mock('../Analytics', () => ({
  default: ({ run }: any) => (
    <div role="region" aria-label="analytics-tab">
      run-id:{run?.id}
    </div>
  ),
}));

vi.mock('@/src/components/EntityTabs/PropertiesTabContent', () => ({
  default: ({ entity, view, headerPostfix, children }: any) => (
    <div role="region" aria-label="properties-tab-content">
      <span>entity-id:{entity?.id}</span>
      <span>view:{view}</span>
      <div role="region" aria-label="header-postfix">
        {headerPostfix}
      </div>
      {children}
    </div>
  ),
}));

describe('Runs View :: TabsContent', () => {
  test('renders ExtractionResult tab content for extraction tab', () => {
    render(<TabsContent run={{ id: 'run-1' }} activeTab={EntityViewTab.ExtractionResult} />);

    expect(screen.getByRole('region', { name: 'extraction-result-tab' })).toHaveTextContent('run-id:run-1');
    expect(screen.queryByRole('region', { name: 'properties-tab-content' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'analytics-tab' })).not.toBeInTheDocument();
  });

  test('renders Analytics tab content for analytics tab', () => {
    render(<TabsContent run={{ id: 'run-1' }} activeTab={EntityViewTab.Analytics} />);

    expect(screen.getByRole('region', { name: 'analytics-tab' })).toHaveTextContent('run-id:run-1');
    expect(screen.queryByRole('region', { name: 'extraction-result-tab' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'properties-tab-content' })).not.toBeInTheDocument();
  });

  // todo: return when summary tab is supported
  // test('renders Summary tab content for summary tab', () => {
  //   render(<TabsContent run={{ id: 'run-1' }} activeTab={EntityViewTab.Summary} />);

  //   expect(screen.getByRole('region', { name: 'properties-tab-content' })).toHaveTextContent('entity-id:run-1');
  //   expect(screen.queryByRole('region', { name: 'extraction-result-tab' })).not.toBeInTheDocument();
  //   expect(screen.queryByRole('region', { name: 'analytics-tab' })).not.toBeInTheDocument();
  // });
});
