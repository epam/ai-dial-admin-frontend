import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ViewerContentType } from '@/src/types/evaluation';

import FullscreenViewer from './FullscreenViewer';

vi.mock('@monaco-editor/react', () => ({
  Editor: ({ value, language }: { value: string; language: string }) => <pre data-language={language}>{value}</pre>,
}));

vi.mock('@epam/ai-dial-ui-kit', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@epam/ai-dial-ui-kit');
  return {
    ...actual,
    DialPopup: ({ open, header, children }: { open: boolean; header: string; children: React.ReactNode }) =>
      open ? (
        <div role="dialog">
          <h2>{header}</h2>
          {children}
        </div>
      ) : null,
  };
});

describe('FullscreenViewer', () => {
  test('Should not render when closed', () => {
    render(
      <FullscreenViewer
        isOpen={false}
        title="Test"
        content='{"key":"value"}'
        contentType={ViewerContentType.Json}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  test('Should render title and formatted content when open', () => {
    render(
      <FullscreenViewer
        isOpen={true}
        title="Test Title"
        content='{"key":"value"}'
        contentType={ViewerContentType.Json}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('Should render text content via Monaco editor', () => {
    render(
      <FullscreenViewer
        isOpen={true}
        title="Logs"
        content="Line 1\nLine 2\nLine 3"
        contentType={ViewerContentType.Text}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
  });

  test('Should render Monaco editor when open', () => {
    render(
      <FullscreenViewer
        isOpen={true}
        title="Test"
        content='{"key":"value"}'
        contentType={ViewerContentType.Json}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
