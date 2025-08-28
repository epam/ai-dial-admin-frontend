import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import ToolsetsList from '../List';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';

describe('ToolsetsList', () => {
  test('renders EntityListView with names and route', () => {
    const data = [{ name: 'Toolset 1' }, { name: 'Toolset 2' }, { name: '' }];
    render(<ToolsetsList data={data} />);
    expect(screen.getByText(MenuI18nKey.Toolsets)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders EntityListView with empty data', () => {
    render(<ToolsetsList data={[]} />);
    expect(screen.getByText(MenuI18nKey.Toolsets)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.NoToolsets)).toBeInTheDocument();
  });
});
