import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import UsageLog from '../UsageLog';
import { MenuI18nKey } from '@/src/constants/i18n';

describe('UsageLog', () => {
  test('renders UsageLog title and data', () => {
    render(<UsageLog data={['row1', 'row2']} />);
    expect(screen.getByText(MenuI18nKey.UsageLog)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('renders empty data gracefully', () => {
    render(<UsageLog data={[]} />);
    expect(screen.getByText(MenuI18nKey.UsageLog)).toBeInTheDocument();
  });
});
