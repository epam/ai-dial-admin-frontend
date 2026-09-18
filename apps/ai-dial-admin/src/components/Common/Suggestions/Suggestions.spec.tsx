import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import Suggestions from './Suggestions';

const onSelectSuggestionSpy = vi.fn();
const onHightLightSuggestionSpy = vi.fn();

const options = [
  { label: 'PDF', value: 'pdf' },
  { label: 'DOC', value: 'doc' },
  { label: 'ZIP', value: 'zip' },
];

describe('Suggestions', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders provided suggestions', () => {
    renderComponent();

    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('DOC')).toBeInTheDocument();
    expect(screen.getByText('ZIP')).toBeInTheDocument();
  });

  test('selects particular suggestion when clicked', async () => {
    renderComponent();

    const suggestionListItems = screen.getAllByRole('listitem');

    fireEvent.mouseDown(suggestionListItems[0]);

    await waitFor(() => {
      expect(onSelectSuggestionSpy).toHaveBeenCalledWith(options.at(0));
    });
  });

  test('highlights particular suggestion when hovered', async () => {
    renderComponent();

    const suggestionListItems = screen.getAllByRole('listitem');

    fireEvent.mouseEnter(suggestionListItems[0]);

    await waitFor(() => {
      expect(onHightLightSuggestionSpy).toHaveBeenCalledWith(0);
    });
  });
});

function renderComponent() {
  return render(
    <Suggestions
      suggestions={options}
      highlightIndex={0}
      onSelectSuggestion={onSelectSuggestionSpy}
      onHightLightSuggestion={onHightLightSuggestionSpy}
    />,
  );
}
