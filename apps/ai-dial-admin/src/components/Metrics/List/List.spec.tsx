import { render, screen } from '@testing-library/react';
import RunsList from './List';
import { describe, expect, test } from 'vitest';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';

describe('RunsList', () => {
  test('renders BaseEntityList with correct props', () => {
    const data = [{ id: '1', name: 'Route One' }, { id: '2', name: 'Route Two' }, { id: '3' }];

    render(<RunsList data={data} />);
    expect(screen.getByText(MenuI18nKey.Runs)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders with empty data', () => {
    render(<RunsList data={[]} />);
    expect(screen.getByText(MenuI18nKey.Runs)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.NoRuns)).toBeInTheDocument();
  });
});
