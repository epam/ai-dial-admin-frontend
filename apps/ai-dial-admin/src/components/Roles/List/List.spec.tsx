import { render, screen } from '@testing-library/react';
import RolesList from './List';
import { describe, expect, test } from 'vitest';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';

describe('RolesList', () => {
  test('renders BaseEntityList with correct props', () => {
    const data = [{ id: '1', name: 'Role One' }, { id: '2', name: 'Role Two' }, { id: '3' }];

    render(<RolesList data={data} />);
    expect(screen.getByText(MenuI18nKey.Roles)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders with empty data', () => {
    render(<RolesList data={[]} />);
    expect(screen.getByText(MenuI18nKey.Roles)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.NoRoles)).toBeInTheDocument();
  });
});

