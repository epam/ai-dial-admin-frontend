import { render, screen } from '@testing-library/react';
import KeysList from '../KeysList';
import { describe, expect, test } from 'vitest';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';

describe('KeysList', () => {
  test('renders BaseEntityList with correct props', () => {
    const data = [{ id: '1', name: 'Key One' }, { id: '2', name: 'Key Two' }, { id: '3' }];

    render(<KeysList data={data} />);
    expect(screen.getByText(MenuI18nKey.Keys)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders with empty data', () => {
    render(<KeysList data={[]} />);
    expect(screen.getByText(MenuI18nKey.Keys)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.NoKeys)).toBeInTheDocument();
  });
});

