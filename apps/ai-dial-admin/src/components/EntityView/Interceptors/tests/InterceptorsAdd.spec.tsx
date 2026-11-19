import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import EntityInterceptors from '@/src/components/EntityView/Interceptors/Interceptors';
import { ButtonsI18nKey, InterceptorsI18nKey } from '@/src/constants/i18n';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/components/Grid/GridView/GridView', () => ({ default: () => null }));
vi.mock('@/src/components/EntityView/AddEntitiesGrid', () => ({
  default: ({ entities, onApply }: { entities: DialInterceptor[]; onApply: (entities: DialInterceptor[]) => void }) => (
    <button onClick={() => onApply(entities)}>Apply selection</button>
  ),
}));

const OPTIONS: DialInterceptor[] = [{ name: 'second' }, { name: 'third' }, { name: 'third' }];

describe('EntityInterceptors', () => {
  test.each([
    [ApplicationRoute.PlatformModels, 'interceptors'],
    [ApplicationRoute.PlatformAppRunners, 'dial:applicationTypeInterceptors'],
  ])('adds unique interceptor names in order for %s', async (view, field) => {
    const user = userEvent.setup();
    const onChangeEntity = vi.fn();
    const entity = { [field]: ['first', 'second', 'first'], displayName: 'Example' };

    render(
      <EntityInterceptors
        entity={entity}
        interceptors={OPTIONS}
        onChangeEntity={onChangeEntity}
        view={view}
        globalInterceptors={[]}
      />,
    );

    await user.click(screen.getByRole('button', { name: new RegExp(InterceptorsI18nKey.Local) }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));
    await user.click(screen.getByRole('button', { name: 'Apply selection' }));

    expect(onChangeEntity).toHaveBeenCalledOnce();
    expect(onChangeEntity).toHaveBeenCalledWith({ ...entity, [field]: ['first', 'second', 'third'] });
    expect(screen.queryByRole('button', { name: 'Apply selection' })).toBeNull();
  });

  test('adds unique interceptor names when no selection exists', async () => {
    const user = userEvent.setup();
    const onChangeEntity = vi.fn();

    render(
      <EntityInterceptors
        entity={{}}
        interceptors={OPTIONS}
        onChangeEntity={onChangeEntity}
        view={ApplicationRoute.PlatformModels}
        globalInterceptors={[]}
      />,
    );

    await user.click(screen.getByRole('button', { name: new RegExp(InterceptorsI18nKey.Local) }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));
    await user.click(screen.getByRole('button', { name: 'Apply selection' }));

    expect(onChangeEntity).toHaveBeenCalledWith({ interceptors: ['second', 'third'] });
  });
});
