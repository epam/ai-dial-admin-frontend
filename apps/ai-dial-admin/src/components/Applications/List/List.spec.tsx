import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import ApplicationsList from './List';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';

describe('ToolsetsList', () => {
  test('renders EntityListView with names and route', () => {
    const data = [{ name: 'Toolset 1' }, { name: 'Toolset 2' }, { name: '' }];
    render(<ApplicationsList data={data} runners={[]} />);
    expect(screen.getByText(MenuI18nKey.Applications)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders EntityListView with empty data', () => {
    render(<ApplicationsList data={[]} runners={[]} />);
    expect(screen.getByText(MenuI18nKey.Applications)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.NoApplications)).toBeInTheDocument();
  });
});
