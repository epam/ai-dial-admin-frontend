import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import CodeViewer from './CodeViewer';

vi.mock('@monaco-editor/react', () => ({
  Editor: ({ value, language }: { value: string; language: string }) => <pre data-language={language}>{value}</pre>,
}));

vi.mock('@/src/components/Common/FullscreenViewer/FullscreenViewer', () => ({
  default: ({ isOpen, title }: { isOpen: boolean; title: string }) =>
    isOpen ? <div data-testid="fullscreen-viewer">{title}</div> : null,
}));

const sampleJson = '{"key":"value","num":42}';

describe('CodeViewer', () => {
  test('Should render collapsed by default with title', () => {
    render(<CodeViewer title="Request" content={sampleJson} />);

    expect(screen.getByText('Request')).toBeInTheDocument();
  });

  test('Should expand on header click showing Monaco editor', () => {
    render(<CodeViewer title="Request" content={sampleJson} />);

    fireEvent.click(screen.getByText('Request'));

    expect(screen.getByText(/"key"/)).toBeInTheDocument();
  });

  test('Should open fullscreen viewer on maximize button click', () => {
    render(<CodeViewer title="Request" content={sampleJson} />);

    const buttons = screen.getAllByRole('button');
    // The last button in the header is the fullscreen (maximize) button
    const fullscreenBtn = buttons[buttons.length - 1];
    fireEvent.click(fullscreenBtn);

    expect(screen.getByTestId('fullscreen-viewer')).toBeInTheDocument();
  });

  test('Should render copy and fullscreen buttons in header', () => {
    const { container } = render(<CodeViewer title="Response" content={sampleJson} />);

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  test('Should omit fullscreen button when hideFullscreen is true', () => {
    const { container } = render(<CodeViewer title="Response" content={sampleJson} hideFullscreen />);

    // Only the copy button should remain in the header
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(1);
    expect(screen.queryByTestId('fullscreen-viewer')).not.toBeInTheDocument();
  });
});
