import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import BackfillDrawer from '@/src/components/Analytics/Common/BackfillSidebar/BackfillDrawer';

const renderDrawer = (isOpen = true) => {
  const onClose = vi.fn();
  const view = render(
    <BackfillDrawer isOpen={isOpen} onClose={onClose} title="Backfill data">
      <button type="button">Inside</button>
    </BackfillDrawer>,
  );

  return { ...view, onClose };
};

// The shared drawer's scrim has no role to find it by; it is the dialog's parent.
const scrim = () => screen.getByRole('dialog').parentElement as HTMLElement;

describe('BackfillDrawer', () => {
  test('renders a dialog named after its title, with the title as its heading and the content inside', () => {
    renderDrawer();

    expect(screen.getByRole('dialog', { name: 'Backfill data' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Backfill data', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inside' })).toBeInTheDocument();
  });

  test('renders nothing while it is closed', () => {
    renderDrawer(false);

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Inside' })).toBeNull();
  });

  test('is wider than the permissions drawer', () => {
    renderDrawer();

    expect(screen.getByRole('dialog')).toHaveClass('w-[600px]');
  });

  test('closes through its close control', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDrawer();

    await user.click(screen.getByRole('button', { name: 'Buttons.Close' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  test('closes on Escape', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDrawer();

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  test('closes when the scrim around the panel is pressed', () => {
    const { onClose } = renderDrawer();

    fireEvent.mouseDown(scrim());

    expect(onClose).toHaveBeenCalledOnce();
  });

  test('stays open when the panel itself is pressed', () => {
    const { onClose } = renderDrawer();

    fireEvent.mouseDown(screen.getByRole('dialog'));
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Inside' }));

    expect(onClose).not.toHaveBeenCalled();
  });

  test('stays open when a popup opened from inside is pressed, though it sits outside the panel', () => {
    const onClose = vi.fn();
    render(
      <BackfillDrawer isOpen onClose={onClose} title="Backfill data">
        <div role="listbox" aria-label="Calendar popup">
          <button type="button">Pick a day</button>
        </div>
      </BackfillDrawer>,
    );

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Pick a day' }));

    expect(onClose).not.toHaveBeenCalled();
  });

  test('stays open when the dim overlay of a popup opened from inside is pressed', () => {
    const onClose = vi.fn();
    render(
      <BackfillDrawer isOpen onClose={onClose} title="Backfill data">
        <div data-testid="popup-overlay" className="bg-blackout">
          <div role="dialog" aria-label="Confirm" />
        </div>
      </BackfillDrawer>,
    );

    fireEvent.mouseDown(screen.getByTestId('popup-overlay'));

    expect(onClose).not.toHaveBeenCalled();
  });

  test('does not close when a press that began inside ends on the scrim, as a text selection drag does', () => {
    const { onClose } = renderDrawer();

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Inside' }));
    fireEvent.mouseUp(scrim());
    fireEvent.click(scrim());

    expect(onClose).not.toHaveBeenCalled();
  });
});
