import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AutocompleteInput from '../AutocompleteInput';

describe('AutocompleteInput', () => {
  const mockUpdateSelected = jest.fn();

  beforeEach(() => {
    mockUpdateSelected.mockClear();
  });

  it('renders input', () => {
    render(<AutocompleteInput placeholder="autocomplete" updateSelected={mockUpdateSelected} />);
    const input = screen.getByRole('textbox', { name: '' });
    expect(input).toBeInTheDocument();
  });

  it('calls updateSelected when input changes', async () => {
    render(<AutocompleteInput placeholder="autocomplete" updateSelected={mockUpdateSelected} />);
    const input = screen.getByRole('textbox', { name: '' });
    await userEvent.type(input, 'test{enter}');
    expect(mockUpdateSelected).toHaveBeenCalled();
  });

  it('removes last selected item when Backspace or Delete is pressed', async () => {
    const selectedItems = ['item1', 'item2', 'item3'];
    render(
      <AutocompleteInput
        placeholder="autocomplete"
        updateSelected={mockUpdateSelected}
        selectedItems={[...selectedItems]}
      />,
    );
    const input = screen.getByRole('textbox', { name: '' });

    await userEvent.type(input, '{backspace}');
    expect(mockUpdateSelected).toHaveBeenCalledWith(['item1', 'item2']);
  });

  it('adds new item to selected list when user enters text and presses Enter', async () => {
    const initialSelected = ['item1', 'item2'];
    render(
      <AutocompleteInput
        placeholder="autocomplete"
        updateSelected={mockUpdateSelected}
        selectedItems={[...initialSelected]}
      />,
    );
    const input = screen.getByRole('textbox', { name: '' });
    await userEvent.type(input, 'newItem{enter}');
    expect(mockUpdateSelected).toHaveBeenCalledWith(['item1', 'item2', 'newItem']);
  });
});
