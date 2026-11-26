import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';

import TryOutTraceLink from '@/src/components/TryOut/components/TryOutTraceLink';
import { GrafanaLinksI18nKey } from '@/src/constants/i18n';

const URL = 'https://grafana.example.com/explore?x=1';

describe('TryOutTraceLink', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test.each([undefined, null, ''])('renders nothing for url %s', (url) => {
    const { container } = render(<TryOutTraceLink url={url} />);

    expect(container).toBeEmptyDOMElement();
  });

  test('is a button named for the trace and the new tab', () => {
    render(<TryOutTraceLink url={URL} />);

    expect(
      screen.getByRole('button', {
        name: `${GrafanaLinksI18nKey.OpenTrace} (${GrafanaLinksI18nKey.OpensInNewTab})`,
      }),
    ).toBeInTheDocument();
  });

  test('opens the trace in a new tab without handing over the opener', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<TryOutTraceLink url={URL} />);

    await userEvent.click(screen.getByRole('button'));

    expect(open).toHaveBeenCalledWith(URL, '_blank', 'noopener,noreferrer');
  });
});
