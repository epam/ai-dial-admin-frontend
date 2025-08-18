import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import AdaptersList from './AdaptersList';

describe('AdaptersList', () => {
  test('renders BaseEntityList with correct props', () => {
    const data = [{ id: '1', name: 'Adapter One' }, { id: '2', name: 'Adapter Two' }, { id: '3' }];

    render(<AdaptersList data={data} />);
    expect(screen.getByText(MenuI18nKey.Adapters)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders with empty data', () => {
    render(<AdaptersList data={[]} />);
    expect(screen.getByText(MenuI18nKey.Adapters)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.NoAdapters)).toBeInTheDocument();
  });
});
