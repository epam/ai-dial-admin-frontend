import { render, screen } from '@testing-library/react';
import RoutesList from './RoutesList';
import { describe, expect, test } from 'vitest';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';

describe('RoutesList', () => {
  test('renders BaseEntityList with correct props', () => {
    const data = [{ id: '1', name: 'Route One' }, { id: '2', name: 'Route Two' }, { id: '3' }];

    render(<RoutesList data={data} />);
    expect(screen.getByText(MenuI18nKey.Routes)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders with empty data', () => {
    render(<RoutesList data={[]} />);
    expect(screen.getByText(MenuI18nKey.Routes)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.NoRoutes)).toBeInTheDocument();
  });
});
