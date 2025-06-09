import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import IconGallery from '@/src/components/IconGallery/IconGallery';
import { fireEvent, getByText } from '@testing-library/react';
import clearAllMocks = jest.clearAllMocks;
import { getIconPath } from '@/src/utils/themes/icon-path';

const icons = [
  {
    url: `MyIcon.svg`,
    name: 'MyIcon',
  },
];

jest.mock('@/src/components/IconGallery/Icons.config', () => ({
  getIconsConfig: jest.fn(() => {
    return icons;
  }),
}));

afterAll(clearAllMocks);

describe('Components - ItemGallery', () => {
  it('Should render icon successfully', () => {
    const setSelectedIcon = jest.fn();
    const { baseElement } = renderWithContext(<IconGallery selectedIcon={''} setSelectedIcon={setSelectedIcon} />);

    expect(baseElement).toBeTruthy();
    const noneOption = baseElement.getElementsByTagName('i')[0];
    expect(noneOption).toBeTruthy();
    expect(getByText(baseElement, 'None')).toBeTruthy();
    const iconOption = baseElement.getElementsByTagName('img')[0];
    const alt = iconOption.getAttribute('alt');
    const url = iconOption.getAttribute('src');
    expect(url).toBe(getIconPath(`${icons[0].name}.svg`));
    expect(alt).toBe(icons[0].name);
  });

  it('Should select none icon successfully', () => {
    const setSelectedIcon = jest.fn();
    const { baseElement } = renderWithContext(<IconGallery selectedIcon={''} setSelectedIcon={setSelectedIcon} />);

    expect(baseElement).toBeTruthy();
    const noneOption = baseElement.getElementsByTagName('button')[0];
    fireEvent.click(noneOption);
    expect(setSelectedIcon).toHaveBeenCalledWith('');
  });

  it('Should select icon successfully', () => {
    const setSelectedIcon = jest.fn();
    const { baseElement } = renderWithContext(<IconGallery selectedIcon={''} setSelectedIcon={setSelectedIcon} />);

    expect(baseElement).toBeTruthy();
    const iconOption = baseElement.getElementsByTagName('button')[1];
    fireEvent.click(iconOption);
    expect(setSelectedIcon).toHaveBeenCalledWith(icons[0].url);
  });
});
