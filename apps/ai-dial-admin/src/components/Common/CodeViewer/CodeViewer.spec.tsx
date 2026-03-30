import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import CodeViewer from './CodeViewer';

const mockOpen = vi.fn();
vi.mock('../FullscreenViewer/FullscreenViewer', () => ({
  useFullscreenViewer: () => ({ open: mockOpen, close: vi.fn() }),
}));

const sampleJson = '{"key":"value","num":42}';

describe('CodeViewer', () => {
  test('Should render collapsed by default with title and size', () => {
    render(<CodeViewer title="Request" content={sampleJson} />);

    expect(screen.getByText('Request')).toBeInTheDocument();
    expect(screen.queryByText(/"key"/)).not.toBeInTheDocument();
  });

  test('Should expand on header click showing formatted JSON', () => {
    render(<CodeViewer title="Request" content={sampleJson} />);

    fireEvent.click(screen.getByText('Request'));

    expect(screen.getByText(/"key"/)).toBeInTheDocument();
  });

  test('Should call fullscreen.open on fullscreen button click', () => {
    render(<CodeViewer title="Request" content={sampleJson} />);

    const fullscreenBtn = screen.getByLabelText('Fullscreen');
    fireEvent.click(fullscreenBtn);

    expect(mockOpen).toHaveBeenCalledWith('Request', sampleJson, 'json');
  });

  test('Should render copy and fullscreen buttons in header', () => {
    const { container } = render(<CodeViewer title="Response" content={sampleJson} />);

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});
