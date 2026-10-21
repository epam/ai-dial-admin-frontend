import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { InterceptorsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

const getProperties = vi.fn().mockResolvedValue({ success: true, response: { globalInterceptors: ['from-admin-be'] } });
vi.mock('@/src/app/[lang]/system-properties/actions', () => ({
  getProperties: () => getProperties(),
}));

const EntityInterceptors = (await import('@/src/components/EntityView/Interceptors/Interceptors')).default;

const renderInterceptors = (globalInterceptors?: string[], view = ApplicationRoute.PlatformAppRunners) =>
  render(
    <EntityInterceptors
      entity={{ 'dial:applicationTypeInterceptors': [] }}
      interceptors={[]}
      globalInterceptors={globalInterceptors}
      onChangeEntity={vi.fn()}
      view={view}
    />,
  );

describe('EntityInterceptors :: global interceptor source', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // `render` runs mount effects inside `act`, so the fetch — if it were going to happen — has already
  // happened by the time these assertions run. The positive control below is what establishes that.
  test('does not read the admin backend when the caller resolved the chain', () => {
    renderInterceptors([]);

    expect(getProperties).not.toHaveBeenCalled();
  });

  test('does not read the admin backend when a non-empty chain is supplied', () => {
    renderInterceptors(['core-global']);

    expect(getProperties).not.toHaveBeenCalled();
  });

  // Positive control — proves the effect fires by the time `render` returns, so the assertions above
  // detect a real change rather than passing on timing.
  test('still reads the admin backend on a surface that supplies no chain', () => {
    renderInterceptors(undefined, ApplicationRoute.Models);

    expect(getProperties).toHaveBeenCalled();
  });

  // Without this, the supplied chain could be dropped entirely and the "no admin-BE read" assertions
  // above would still pass — the Core-resolved globals would simply never appear.
  test('displays the supplied chain rather than merely suppressing the fetch', async () => {
    renderInterceptors(['core-global-one', 'core-global-two']);

    expect(await screen.findByText(`${InterceptorsI18nKey.Global}: 2`)).toBeInTheDocument();
  });

  test('shows an empty global section when Core resolves no global chain', async () => {
    renderInterceptors([]);

    expect(await screen.findByText(`${InterceptorsI18nKey.Global}: 0`)).toBeInTheDocument();
  });

  // A prop arriving after mount must still be honoured — the state initializer alone cannot cover it.
  test('adopts a chain supplied after mount', async () => {
    const { rerender } = renderInterceptors([]);

    rerender(
      <EntityInterceptors
        entity={{ 'dial:applicationTypeInterceptors': [] }}
        interceptors={[]}
        globalInterceptors={['added-later']}
        onChangeEntity={vi.fn()}
        view={ApplicationRoute.PlatformAppRunners}
      />,
    );

    expect(await screen.findByText(`${InterceptorsI18nKey.Global}: 1`)).toBeInTheDocument();
  });
});
