import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import HeaderTabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import { TabsI18nKey } from '@/src/constants/i18n';
import { EntityViewTab } from '@/src/utils/tabs/utils';

const PROPERTIES_TAB = { id: EntityViewTab.Properties, label: 'Properties' };
const SECOND_TAB = { id: 'second', label: 'Second' };

describe('HeaderTabs', () => {
  const renderTabs = (tabs = [PROPERTIES_TAB, SECOND_TAB], onChangeActiveTab = vi.fn()) =>
    render(<HeaderTabs tabs={tabs} activeTab={EntityViewTab.Properties} onChangeActiveTab={onChangeActiveTab} />);

  test('renders the tab list when the entity has several tabs', () => {
    renderTabs();

    expect(screen.getByRole('tablist', { name: TabsI18nKey.ListLabel })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });

  test('renders no tab list when the entity has a single tab', () => {
    renderTabs([PROPERTIES_TAB]);

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  test('reports a newly selected tab', async () => {
    const user = userEvent.setup();
    const onChangeActiveTab = vi.fn();
    renderTabs(undefined, onChangeActiveTab);

    await user.click(screen.getByRole('tab', { name: 'Second' }));

    expect(onChangeActiveTab).toHaveBeenCalledWith('second');
  });
});
