import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import ApplicationRunnersList from './List';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';

describe('ApplicationRunnersList', () => {
  test('renders ApplicationRunnersList with data', () => {
    const data = [
      { 'dial:applicationTypeDisplayName': 'Runner 1' },
      { 'dial:applicationTypeDisplayName': 'Runner 2' },
      { 'dial:applicationTypeDisplayName': '' },
    ];
    render(<ApplicationRunnersList data={data} />);
    expect(screen.getByText(MenuI18nKey.ApplicationRunners)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders ApplicationRunnersList without data', () => {
    render(<ApplicationRunnersList data={[]} />);
    expect(screen.getByText(MenuI18nKey.ApplicationRunners)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.NoApplicationRunners)).toBeInTheDocument();
  });
});
