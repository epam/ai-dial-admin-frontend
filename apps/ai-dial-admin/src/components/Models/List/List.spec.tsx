import { render, screen } from '@testing-library/react';
import ModelsList from './List';
import { describe, expect, test } from 'vitest';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';

describe('ModelsList', () => {
  test('renders BaseEntityList with correct props', () => {
    const data = [{ id: '1', name: 'Interceptor One' }, { id: '2', name: 'Interceptor Two' }, { id: '3' }];

    render(<ModelsList data={data} />);
    expect(screen.getByText(MenuI18nKey.Models)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders with empty data', () => {
    render(<ModelsList data={[]} />);
    expect(screen.getByText(MenuI18nKey.Models)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.NoModels)).toBeInTheDocument();
  });
});

