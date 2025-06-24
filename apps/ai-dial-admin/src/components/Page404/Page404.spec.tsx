import { ErrorI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Page404 from './Page404';

describe('Page404', () => {
  test('Should render not found page with icon, messages, and link', () => {
    render(<Page404 />);
    expect(screen.getByText(ErrorI18nKey.PageNotFound)).toBeInTheDocument();
    expect(screen.getByText(ErrorI18nKey.ResourceNotFound)).toBeInTheDocument();
    expect(screen.getByText(ErrorI18nKey.CheckUrl)).toBeInTheDocument();
    expect(screen.getByText(MenuI18nKey.Homepage)).toBeInTheDocument();

    const link = screen.getByRole('link', { name: MenuI18nKey.Homepage });
    expect(link).toHaveAttribute('href', ApplicationRoute.Home);
  });
});
