import { ButtonsI18nKey, EntitiesI18nKey, InterceptorsI18nKey } from '@/src/constants/i18n';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
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
