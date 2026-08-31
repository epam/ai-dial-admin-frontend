import { ButtonsI18nKey, EntitiesI18nKey, InterceptorsI18nKey } from '@/src/constants/i18n';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ApplicationRoute } from '@/src/types/routes';
import EntityInterceptors from '../Interceptors';

describe('EntityInterceptors', () => {
  test('renders interceptors count and grid', () => {
    const entity = { interceptors: ['int1', 'int2'] };
    const interceptors = [{ name: 'int1' }, { name: 'int2' }];
    const onChangeEntity = vi.fn();

    render(<EntityInterceptors entity={entity} interceptors={interceptors} onChangeEntity={onChangeEntity} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('opens add modal when Add button is clicked', () => {
    const entity = { interceptors: [] };
    const interceptors = [{ name: 'int3' }];
    const onChangeEntity = vi.fn();

    render(<EntityInterceptors entity={entity} interceptors={interceptors} onChangeEntity={onChangeEntity} />);

    fireEvent.click(screen.getByText(ButtonsI18nKey.Add));
    expect(screen.getByText(InterceptorsI18nKey.Add)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.NoInterceptors)).toBeInTheDocument();
  });
});

/**
 * Both runner surfaces hold their selection in `dial:applicationTypeInterceptors`. When this component
 * branched on the entity route only, the asset view silently read `interceptors` — so the count showed 0
 * however many were selected — and wrote `interceptors` back, which Core stores verbatim and keeps
 * forever. The local count is the cheapest observable proof of which field is being read.
 */
describe('EntityInterceptors :: runner field selection', () => {
  const interceptors = [{ name: 'runner-int' }, { name: 'other' }];
  const renderFor = (view: ApplicationRoute, entity: object) => {
    cleanup();
    render(<EntityInterceptors entity={entity} interceptors={interceptors} onChangeEntity={vi.fn()} view={view} />);
  };

  test.each([ApplicationRoute.ApplicationRunners, ApplicationRoute.PlatformAppRunners])(
    'Should count dial:applicationTypeInterceptors for %s',
    (view) => {
      renderFor(view, { 'dial:applicationTypeInterceptors': ['runner-int'] });

      expect(screen.getByText(`${InterceptorsI18nKey.Local}: 1`)).toBeInTheDocument();
    },
  );

  test('Should ignore the generic interceptors field on the asset runner view', () => {
    renderFor(ApplicationRoute.PlatformAppRunners, { interceptors: ['runner-int', 'other'] });

    expect(screen.queryByText(`${InterceptorsI18nKey.Local}: 2`)).not.toBeInTheDocument();
  });
});
