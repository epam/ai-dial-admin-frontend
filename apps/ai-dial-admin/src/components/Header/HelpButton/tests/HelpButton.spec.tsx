import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import HelpButton from '../HelpButton';
import { HELP_DOCUMENTATION_LINKS } from '@/src/constants/help-documentation-links';
import { HeaderI18nKey } from '@/src/constants/i18n';
import { HelpTopicProvider, useHelpRoute } from '@/src/context/HelpTopicContext';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ featureFlags: {} }),
}));

const DOC_LINK = 'https://docs.test/';

const TopicSetter = ({ route }: { route: ApplicationRoute }) => {
  useHelpRoute(route);
  return null;
};

describe('HelpButton', () => {
  const renderButton = (topic?: ApplicationRoute) =>
    render(
      <HelpTopicProvider>
        {topic && <TopicSetter route={topic} />}
        <HelpButton docLink={DOC_LINK} />
      </HelpTopicProvider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePathname).mockReturnValue('/en/containers/my-box');
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  test('uses the documentation of the page topic over the one derived from the URL', async () => {
    const user = userEvent.setup();
    renderButton(ApplicationRoute.AdapterContainers);

    await user.click(screen.getByRole('button', { name: HeaderI18nKey.Help }));
    await user.click(
      await screen.findByText(HELP_DOCUMENTATION_LINKS[ApplicationRoute.AdapterContainers]?.title as string),
    );

    expect(window.open).toHaveBeenCalledWith(
      `${DOC_LINK}${HELP_DOCUMENTATION_LINKS[ApplicationRoute.AdapterContainers]?.selectedView}`,
      '_blank',
      'noopener,noreferrer',
    );
  });

  test('reports the menu as expanded while it is open', async () => {
    const user = userEvent.setup();
    renderButton(ApplicationRoute.AdapterContainers);
    const button = screen.getByRole('button', { name: HeaderI18nKey.Help });

    await user.click(button);

    expect(
      await screen.findByText(HELP_DOCUMENTATION_LINKS[ApplicationRoute.AdapterContainers]?.title as string),
    ).toBeTruthy();
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  test('falls back to the URL-derived documentation when no page topic is set', async () => {
    vi.mocked(usePathname).mockReturnValue('/en/deployment-images');
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole('button', { name: HeaderI18nKey.Help }));
    await user.click(await screen.findByText(HELP_DOCUMENTATION_LINKS[ApplicationRoute.Images]?.title as string));

    expect(window.open).toHaveBeenCalledWith(
      `${DOC_LINK}${HELP_DOCUMENTATION_LINKS[ApplicationRoute.Images]?.listView}`,
      '_blank',
      'noopener,noreferrer',
    );
  });

  test('renders nothing on the unified containers list, which has no documentation of its own', () => {
    vi.mocked(usePathname).mockReturnValue('/en/containers');
    renderButton();

    expect(screen.queryByRole('button', { name: HeaderI18nKey.Help })).not.toBeInTheDocument();
  });

  test('renders nothing without a documentation link', () => {
    render(
      <HelpTopicProvider>
        <HelpButton />
      </HelpTopicProvider>,
    );

    expect(screen.queryByRole('button', { name: HeaderI18nKey.Help })).not.toBeInTheDocument();
  });

  test('shows its name as a tooltip on hover', async () => {
    const user = userEvent.setup();
    renderButton(ApplicationRoute.AdapterContainers);

    await user.hover(screen.getByRole('button', { name: HeaderI18nKey.Help }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(HeaderI18nKey.Help);
  });
});
