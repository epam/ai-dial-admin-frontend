import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { FullscreenViewerProvider, useFullscreenViewer } from './FullscreenViewer';

vi.mock('@monaco-editor/react', () => ({
  Editor: ({ value, language }: { value: string; language: string }) => <pre data-language={language}>{value}</pre>,
}));

const Trigger = () => {
  const { open } = useFullscreenViewer();
  return <button onClick={() => open('Test Title', '{"key":"value"}', 'json')}>Open</button>;
};

const TextTrigger = () => {
  const { open } = useFullscreenViewer();
  return <button onClick={() => open('Logs', 'Line 1\nLine 2\nLine 3', 'text')}>Open Text</button>;
};

describe('FullscreenViewer', () => {
  test('Should not render modal initially', () => {
    render(
      <FullscreenViewerProvider>
        <Trigger />
      </FullscreenViewerProvider>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('Should open modal on trigger and show title', () => {
    render(
      <FullscreenViewerProvider>
        <Trigger />
      </FullscreenViewerProvider>,
    );

    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('Should close on Escape key', () => {
    render(
      <FullscreenViewerProvider>
        <Trigger />
      </FullscreenViewerProvider>,
    );

    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('Should render text content via Monaco editor', () => {
    render(
      <FullscreenViewerProvider>
        <TextTrigger />
      </FullscreenViewerProvider>,
    );

    fireEvent.click(screen.getByText('Open Text'));
    expect(screen.getByText('Logs')).toBeInTheDocument();
    const editor = screen.getByText(/Line 1/);
    expect(editor).toBeInTheDocument();
  });

  test('Should render copy button in fullscreen viewer', () => {
    render(
      <FullscreenViewerProvider>
        <Trigger />
      </FullscreenViewerProvider>,
    );

    fireEvent.click(screen.getByText('Open'));
    const dialog = screen.getByRole('dialog');
    const buttons = dialog.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});
