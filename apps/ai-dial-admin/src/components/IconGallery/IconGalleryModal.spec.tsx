import IconGalleryModal from '@/src/components/IconGallery/IconGalleryModal';
import { PopUpState } from '@/src/types/pop-up';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { fireEvent, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

const icons = [
  {
    url: `MyIcon.svg`,
    name: 'MyIcon',
  },
];

vi.mock('@/src/components/IconGallery/Icons.config', () => ({
  getIconsConfig: vi.fn(() => {
    return icons;
  }),
}));

const onClose = vi.fn();
const onChange = vi.fn();

describe('Components - ItemGallery', () => {
  test('Should render icon successfully', () => {
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
