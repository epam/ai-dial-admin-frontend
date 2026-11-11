import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import FullscreenDiffViewer from '@/src/components/Runs/Details/BottomDrawer/FullscreenDiffViewer';

describe('FullscreenDiffViewer', () => {
  const renderViewer = () =>
    render(
      <FullscreenDiffViewer
        isOpen
        fieldLabel="requestBody"
        original="first value"
        modified="second value"
        originalLabel="Run A"
        modifiedLabel="Run B"
        onClose={vi.fn()}
      />,
    );

  test('offers a copy button for each side, named after its run', () => {
    renderViewer();

    expect(screen.getByRole('button', { name: 'copy requestBody (Run A)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'copy requestBody (Run B)' })).toBeTruthy();
  });

  test('copies the value of the side whose button is clicked', async () => {
    renderViewer();

    await userEvent.setup().click(screen.getByRole('button', { name: 'copy requestBody (Run B)' }));

    expect(await navigator.clipboard.readText()).toBe('second value');
  });
});
