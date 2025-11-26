import { ErrorI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Page404 from './Page404';

describe('Page404', () => {
  test('Should render not found page with icon, messages, and link', () => {
    render(<Page404 />);
    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(screen.getByText('Resource not found or no longer available.')).toBeInTheDocument();
    expect(screen.getByText('Please check the URL or go back to the')).toBeInTheDocument();
    expect(screen.getByText('Homepage')).toBeInTheDocument();

    const link = screen.getByText('Homepage');
    expect(link).toHaveAttribute('href', ApplicationRoute.Home);
  });
});
