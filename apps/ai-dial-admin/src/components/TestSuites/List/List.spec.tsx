import { render, screen } from '@testing-library/react';
import TestSuitesList from './List';
import { describe, expect, test } from 'vitest';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';

describe('TestSuitsList', () => {
  test('renders BaseEntityList with correct props', () => {
    const data = [{ id: '1', name: 'Route One' }, { id: '2', name: 'Route Two' }, { id: '3' }];

    render(<TestSuitesList data={data} />);
    expect(screen.getByText(MenuI18nKey.TestSuits)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders with empty data', () => {
    render(<TestSuitesList data={[]} />);
    expect(screen.getByText(MenuI18nKey.TestSuits)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.NoTestSuits)).toBeInTheDocument();
  });
});
