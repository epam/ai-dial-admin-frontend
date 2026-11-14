import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import ApplicationGrafanaLinks from '@/src/components/Assets/ApplicationGrafanaLinks/ApplicationGrafanaLinks';
import { GrafanaLinksI18nKey } from '@/src/constants/i18n';
import { GrafanaTraceLinks } from '@/src/utils/grafana/models';

const LINKS: GrafanaTraceLinks = {
  allTracesUrl: 'https://grafana.example.com/explore?all',
  errorTracesUrl: 'https://grafana.example.com/explore?errors',
};

const renderLinks = (links?: GrafanaTraceLinks | null) => render(<ApplicationGrafanaLinks links={links} />);

const openMenu = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: GrafanaLinksI18nKey.Traces }));
  return user;
};

describe('ApplicationGrafanaLinks', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders one button that holds both options, closed until opened', () => {
    renderLinks(LINKS);

    expect(screen.getAllByRole('button', { name: GrafanaLinksI18nKey.Traces })).toHaveLength(1);
    expect(screen.queryByRole('menuitem')).toBeNull();
  });

  test('offers the all-traces and errors-only options once opened', async () => {
    renderLinks(LINKS);

    await openMenu();

    expect(await screen.findByRole('menuitem', { name: new RegExp(GrafanaLinksI18nKey.AllTraces) })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: new RegExp(GrafanaLinksI18nKey.ErrorTraces) })).toBeTruthy();
  });

  test('opens the all-traces URL in a new tab without an opener', async () => {
    renderLinks(LINKS);
    const user = await openMenu();

    await user.click(await screen.findByRole('menuitem', { name: new RegExp(GrafanaLinksI18nKey.AllTraces) }));

    expect(window.open).toHaveBeenCalledExactlyOnceWith(LINKS.allTracesUrl, '_blank', 'noopener,noreferrer');
  });

  test('opens the errors-only URL in a new tab without an opener', async () => {
    renderLinks(LINKS);
    const user = await openMenu();

    await user.click(await screen.findByRole('menuitem', { name: new RegExp(GrafanaLinksI18nKey.ErrorTraces) }));

    expect(window.open).toHaveBeenCalledExactlyOnceWith(LINKS.errorTracesUrl, '_blank', 'noopener,noreferrer');
  });

  test('tells assistive technology that each option opens in a new tab', async () => {
    renderLinks(LINKS);

    await openMenu();

    const hint = new RegExp(GrafanaLinksI18nKey.OpensInNewTab);
    expect(await screen.findAllByRole('menuitem', { name: hint })).toHaveLength(2);
  });

  test.each([null, undefined])('renders nothing for %s links', (links) => {
    renderLinks(links);

    expect(screen.queryByRole('button')).toBeNull();
  });
});
