import { render, screen } from '@testing-library/react';
import Breadcrumbs from '../Breadcrumbs';
import { describe, expect, test, vi } from 'vitest';
import { MenuI18nKey } from '@/src/constants/i18n';

const mockSearchParams = { value: new URLSearchParams() };
vi.mock('next/navigation', () => ({
  usePathname: () => '/models/1',
  useSearchParams: () => mockSearchParams.value,
}));

describe('Components - Breadcrumbs', () => {
  test('Should render breadcrumbs for desktop', () => {
    render(<Breadcrumbs mobile={false} />);
    expect(screen.getByText(MenuI18nKey.Models)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    // Check that the chevron is rendered between breadcrumbs
    const allText = screen.getByText(MenuI18nKey.Models).parentElement?.parentElement?.textContent;
    expect(allText).toContain(MenuI18nKey.Models);
  });

  test('Should render breadcrumbs for mobile', () => {
    render(<Breadcrumbs mobile={true} />);
    expect(screen.getByText(MenuI18nKey.Models)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('Should point the list breadcrumb at the platform route when configFile=true', () => {
    mockSearchParams.value = new URLSearchParams('configFile=true');

    render(<Breadcrumbs mobile={false} />);

    const link = screen.getByText(MenuI18nKey.Models).closest('a');
    expect(link).toHaveAttribute('href', '/platform-models');

    mockSearchParams.value = new URLSearchParams();
  });
});
