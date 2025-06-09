import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import IconGalleryModal from '@/src/components/IconGallery/IconGalleryModal';
import { fireEvent, within } from '@testing-library/react';
import { PopUpState } from '@/src/types/pop-up';

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

const onClose = jest.fn();
const onChange = jest.fn();

describe('Components - ItemGallery', () => {
  it('Should render icon successfully', () => {
    const { baseElement } = renderWithContext(
      <IconGalleryModal modalState={PopUpState.Opened} onChange={onChange} onClose={onClose} selectedValue={''} />,
    );

    expect(baseElement).toBeTruthy();

    const applyButton = within(baseElement).getByText('Buttons.Apply');
    fireEvent.click(applyButton);
    expect(onClose).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
  });
});
