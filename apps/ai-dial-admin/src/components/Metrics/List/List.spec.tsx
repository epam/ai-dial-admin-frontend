import { render, screen } from '@testing-library/react';
import MetricsList from './List';
import { describe, expect, test } from 'vitest';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';

describe('MetricsList', () => {
  test('renders BaseEntityList with correct props', () => {
    const data = [{ id: '1', name: 'Route One' }, { id: '2', name: 'Route Two' }, { id: '3' }];

    render(<MetricsList data={data} />);
    expect(screen.getByText(MenuI18nKey.Metrics)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders with empty data', () => {
    render(<MetricsList data={[]} />);
    expect(screen.getByText(MenuI18nKey.Metrics)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.NoMetrics)).toBeInTheDocument();
  });
});
