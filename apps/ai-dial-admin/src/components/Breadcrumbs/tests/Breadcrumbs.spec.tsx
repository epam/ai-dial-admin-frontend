import { render } from '@testing-library/react';
import Breadcrumbs from '@/src/components/Breadcrumbs/Breadcrumbs';
import { MenuI18nKey } from '@/src/constants/i18n';
import { describe, expect, test, vi } from 'vitest';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname() {
    return mockUsePathname();
  },
}));

describe('Components - Breadcrumbs', () => {
  test('Should render successfully single breadcrumb', () => {
    mockUsePathname.mockImplementation(() => '/en/models');
    const { baseElement } = render(<Breadcrumbs mobile={false} />);
    const list = baseElement.getElementsByTagName('ol');
    const listItems = baseElement.getElementsByTagName('li');

    expect(baseElement).toBeTruthy();
    expect(list).toBeTruthy();
    expect(listItems.length).toBe(1);
    expect(listItems[0].textContent).toBe(MenuI18nKey.Models);
  });

  test('Should render successfully single mobile breadcrumb', () => {
    mockUsePathname.mockImplementation(() => '/en/models');
    const { baseElement } = render(<Breadcrumbs mobile={true} />);
    const list = baseElement.getElementsByTagName('ol');
    const listItems = baseElement.getElementsByTagName('li');

    expect(baseElement).toBeTruthy();
    expect(list).toBeTruthy();
    expect(listItems.length).toBe(1);
    expect(listItems[0].textContent).toBe(MenuI18nKey.Models);
  });

  test('Should render successfully multiple breadcrumbs', () => {
    mockUsePathname.mockImplementation(() => '/en/applications/applicationId');
    const { baseElement } = render(<Breadcrumbs mobile={false} />);
    const list = baseElement.getElementsByTagName('ol');
    const listItems = baseElement.getElementsByTagName('li');
    const icon = baseElement.getElementsByTagName('svg');

    expect(list).toBeTruthy();
    expect(listItems.length).toBe(2);
    expect(icon).toBeTruthy();
    expect(icon[0].classList.contains('text-secondary')).toBeTruthy();
    expect(listItems[0].textContent).toBe(MenuI18nKey.Applications);
  });

  test('Should render nothing if there is no path', () => {
    mockUsePathname.mockImplementation(() => null);
    const { baseElement } = render(<Breadcrumbs mobile={false} />);
    const list = baseElement.getElementsByTagName('ol');

    expect(list.length).toBe(0);
  });

  test('Should render successfully path not from config', () => {
    mockUsePathname.mockImplementation(() => '/en/unknown');
    const { baseElement } = render(<Breadcrumbs mobile={false} />);
    const list = baseElement.getElementsByTagName('ol');
    const listItems = baseElement.getElementsByTagName('li');

    expect(baseElement).toBeTruthy();
    expect(list).toBeTruthy();
    expect(listItems.length).toBe(1);
    expect(listItems[0].textContent).toBe('unknown');
  });
});
