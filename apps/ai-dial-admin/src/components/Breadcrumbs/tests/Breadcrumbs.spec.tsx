import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import Breadcrumbs from '@/src/components/Breadcrumbs/Breadcrumbs';
import { MenuI18nKey } from '@/src/constants/i18n';
import clearAllMocks = jest.clearAllMocks;

const mockUsePathname = jest.fn();

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: jest.fn(),
  usePathname() {
    return mockUsePathname();
  },
}));

afterAll(clearAllMocks);

describe('Components - Breadcrumbs', () => {
  it('Should render successfully single breadcrumb', () => {
    mockUsePathname.mockImplementation(() => '/en/models');
    const { baseElement } = renderWithContext(<Breadcrumbs mobile={false} />);
    const list = baseElement.getElementsByTagName('ol');
    const listItems = baseElement.getElementsByTagName('li');

    expect(baseElement).toBeTruthy();
    expect(list).toBeTruthy();
    expect(listItems.length).toBe(1);
    expect(listItems[0].textContent).toBe(MenuI18nKey.Models);
  });

  it('Should render successfully single mobile breadcrumb', () => {
    mockUsePathname.mockImplementation(() => '/en/models');
    const { baseElement } = renderWithContext(<Breadcrumbs mobile={true} />);
    const list = baseElement.getElementsByTagName('ol');
    const listItems = baseElement.getElementsByTagName('li');

    expect(baseElement).toBeTruthy();
    expect(list).toBeTruthy();
    expect(listItems.length).toBe(1);
    expect(listItems[0].textContent).toBe(MenuI18nKey.Models);
  });

  it('Should render successfully multiple breadcrumbs', () => {
    mockUsePathname.mockImplementation(() => '/en/applications/applicationId');
    const { baseElement } = renderWithContext(<Breadcrumbs mobile={false} />);
    const list = baseElement.getElementsByTagName('ol');
    const listItems = baseElement.getElementsByTagName('li');
    const icon = baseElement.getElementsByTagName('svg');

    expect(list).toBeTruthy();
    expect(listItems.length).toBe(2);
    expect(icon).toBeTruthy();
    expect(icon[0].classList.contains('text-secondary')).toBeTruthy();
    expect(listItems[0].textContent).toBe(MenuI18nKey.Applications);
  });

  it('Should render nothing if there is no path', () => {
    mockUsePathname.mockImplementation(() => null);
    const { baseElement } = renderWithContext(<Breadcrumbs mobile={false} />);
    const list = baseElement.getElementsByTagName('ol');

    expect(list.length).toBe(0);
  });

  it('Should render successfully path not from config', () => {
    mockUsePathname.mockImplementation(() => '/en/unknown');
    const { baseElement } = renderWithContext(<Breadcrumbs mobile={false} />);
    const list = baseElement.getElementsByTagName('ol');
    const listItems = baseElement.getElementsByTagName('li');

    expect(baseElement).toBeTruthy();
    expect(list).toBeTruthy();
    expect(listItems.length).toBe(1);
    expect(listItems[0].textContent).toBe('unknown');
  });
});
