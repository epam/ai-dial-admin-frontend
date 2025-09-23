import { render, screen } from '@testing-library/react';
import InterceptorsList from './List';
import { describe, expect, test } from 'vitest';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';

describe('InterceptorsList', () => {
  test('renders BaseEntityList with correct props', () => {
    const data = [{ id: '1', name: 'Interceptor One' }, { id: '2', name: 'Interceptor Two' }, { id: '3' }];

    render(<InterceptorsList data={data} />);
    expect(screen.getByText(MenuI18nKey.Interceptors)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders with empty data', () => {
    render(<InterceptorsList data={[]} />);
    expect(screen.getByText(MenuI18nKey.Interceptors)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.NoInterceptors)).toBeInTheDocument();
  });
});

