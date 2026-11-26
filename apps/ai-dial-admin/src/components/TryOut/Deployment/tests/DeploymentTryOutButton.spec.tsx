import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import DeploymentTryOutButton from '@/src/components/TryOut/Deployment/DeploymentTryOutButton';
import { TRY_OUT_SIDEBAR_CLASS_NAME } from '@/src/components/TryOut/constants';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { appContextMock } from '@/test-mocks/app-context';

vi.mock('@/src/components/TryOut/Deployment/DeploymentTryOut', () => ({
  default: ({ deployment }: { deployment: string }) => <div>panel:{deployment}</div>,
}));

describe('DeploymentTryOutButton', () => {
  test('is a Try out button', () => {
    render(<DeploymentTryOutButton deployment="gpt-4" />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.TryOut })).toBeInTheDocument();
  });

  test('opens the Try out panel for the deployment in the shared sidebar', async () => {
    render(<DeploymentTryOutButton deployment="gpt-4" />);

    await userEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.TryOut }));

    expect(appContextMock.sidebar.showSidebar).toHaveBeenCalledOnce();
    const [content, className] = appContextMock.sidebar.showSidebar.mock.calls[0];
    expect(className).toBe(TRY_OUT_SIDEBAR_CLASS_NAME);
    render(<>{content}</>);
    expect(screen.getByText('panel:gpt-4')).toBeInTheDocument();
  });

  test('closes the sidebar when the button goes away', () => {
    const { unmount } = render(<DeploymentTryOutButton deployment="gpt-4" />);

    unmount();

    expect(appContextMock.sidebar.closeSidebar).toHaveBeenCalledOnce();
  });
});
