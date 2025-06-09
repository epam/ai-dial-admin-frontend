import { fireEvent, render } from '@testing-library/react';
import { PopUpState } from '@/src/types/pop-up';
import SettingsModal from './SettingsModal';

jest.mock('@/src/context/ThemeContext', () => ({
  useTheme: jest.fn(() => {
    return {
      themes: [
        { id: 'theme1', displayName: 'displayName 1' },
        { id: 'theme2', displayName: 'displayName 2' },
      ],
      currentTheme: 'theme1',
      setTheme: jest.fn(),
    };
  }),
}));

describe('Common :: SettingsModal', () => {
  it('Should render successfully', () => {
    let settings: { theme?: string } | undefined = void 0;
    const onConfirm = (set: { theme?: string }) => {
      settings = set;
    };

    const { baseElement, getByTestId } = render(
      <SettingsModal modalState={PopUpState.Opened} onConfirm={onConfirm} onClose={jest.fn()} />,
    );
    expect(baseElement).toBeTruthy();
    expect(settings).toBeUndefined();
    const confirmBtn = getByTestId('settingsConfirm');
    fireEvent.click(confirmBtn);
    expect(settings).toEqual({ theme: 'theme1' });
  });
});
