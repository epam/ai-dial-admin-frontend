import { ErrorI18nKey } from '@/src/constants/i18n';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import PageMaintenance from './PageMaintenance';

describe('PageMaintenance', () => {
  test('renders maintenance page with icon and messages', () => {
    render(<PageMaintenance />);
    expect(screen.getByText(ErrorI18nKey.MaintenanceInProgress)).toBeInTheDocument();
    expect(screen.getByText(ErrorI18nKey.SystemUnavailable)).toBeInTheDocument();
    expect(screen.getByText(ErrorI18nKey.TryAgainLater)).toBeInTheDocument();
  });
});
