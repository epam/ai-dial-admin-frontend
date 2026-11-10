import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import RouteContent from '../RouteContent';
import EntityRoutes from '@/src/components/EntityView/AppRoute/AppRoute';
import { ActionMenuOperationI18nKey, ButtonsI18nKey, TabsI18nKey } from '@/src/constants/i18n';

describe('RouteContent', () => {
  const route = { id: 'route1', paths: [''] };

  test('renders tabs and RouteProperties by default', () => {
    render(<RouteContent route={route} onChangeRoute={vi.fn()} roles={[]} isCoreRoleSource={false} />);
    expect(screen.getByRole('tab', { name: TabsI18nKey.Attachments })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: TabsI18nKey.Roles })).toBeInTheDocument();
  });

  test('passes the legacy source from the route owner to the roles tab', async () => {
    const user = userEvent.setup();
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(
      <EntityRoutes
        routes={[{ name: 'route', roleLimits: { admin: { enabled: true } } }]}
        roles={[]}
        onChangeRoutes={vi.fn()}
        disabled
      />,
    );

    await user.click(await screen.findByRole('tab', { name: TabsI18nKey.Roles }));
    await screen.findByText('admin');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Actions }));
    await user.click(screen.getByText(ActionMenuOperationI18nKey.Open_in_new_tab));
    expect(windowOpen).toHaveBeenCalledWith('/roles/admin', '_blank');
    windowOpen.mockRestore();
  });
});
