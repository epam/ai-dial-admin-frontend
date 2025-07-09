import { render, screen } from '@testing-library/react';
import Breadcrumbs from '../Breadcrumbs';
import { describe, expect, test, vi } from 'vitest';
import { MenuI18nKey } from '@/src/constants/i18n';

vi.mock('next/navigation', () => ({
  usePathname: () => '/models/1',
}));

describe('Components - Breadcrumbs', () => {
  test('Should render breadcrumbs for desktop', () => {
    render(<Breadcrumbs mobile={false} />);
    expect(screen.getByText(MenuI18nKey.Models)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    // Check that the chevron is rendered between breadcrumbs
    const allText = screen.getByText(MenuI18nKey.Models).parentElement?.parentElement?.textContent;
    expect(allText).toContain(MenuI18nKey.Models);
    expect(allText).toContain('1');
  });

  test('Should render breadcrumbs for mobile', () => {
    render(<Breadcrumbs mobile={true} />);
    expect(screen.getByText(MenuI18nKey.Models)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
