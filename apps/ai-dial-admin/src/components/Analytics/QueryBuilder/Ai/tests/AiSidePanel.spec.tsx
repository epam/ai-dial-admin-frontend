import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FC, useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import AiSidePanel from '@/src/components/Analytics/QueryBuilder/Ai/AiSidePanel';

describe('AiSidePanel', () => {
  const renderPanel = (props?: Partial<Parameters<typeof AiSidePanel>[0]>) => {
    const onToggle = vi.fn();
    render(
      <AiSidePanel isOpen={false} isOverlay={false} onToggle={onToggle} {...props}>
        <p>assistant content</p>
      </AiSidePanel>,
    );
    return onToggle;
  };

  test('renders one collapsed expand button and no content when closed', () => {
    renderPanel();

    const expand = screen.getByRole('button', { name: 'QueryBuilder.AiPanelExpand' });
    expect(expand).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(screen.queryByText('assistant content')).toBeNull();
  });

  test('asks to open when the collapsed button is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = renderPanel();

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.AiPanelExpand' }));

    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  test('renders a named panel with its content and a collapse button that controls it when open', () => {
    renderPanel({ isOpen: true });

    const panel = screen.getByRole('complementary', { name: 'QueryBuilder.AskAi' });
    expect(within(panel).getByText('assistant content')).toBeInTheDocument();
    const collapse = within(panel).getByRole('button', { name: 'QueryBuilder.AiPanelCollapse' });
    expect(collapse).toHaveAttribute('aria-expanded', 'true');
    expect(collapse).toHaveAttribute('aria-controls', panel.id);
    expect(screen.queryByRole('button', { name: 'QueryBuilder.AiPanelExpand' })).toBeNull();
  });

  test('asks to close when the collapse button is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = renderPanel({ isOpen: true });

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.AiPanelCollapse' }));

    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  test('renders the same panel and content when shown as an overlay', () => {
    renderPanel({ isOpen: true, isOverlay: true });

    const panel = screen.getByRole('complementary', { name: 'QueryBuilder.AskAi' });
    expect(within(panel).getByText('assistant content')).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'QueryBuilder.AiPanelCollapse' })).toBeInTheDocument();
  });

  test('moves focus to the collapse control on opening and back to the Ask AI control on closing', async () => {
    const user = userEvent.setup();
    const Toggled: FC = () => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <AiSidePanel isOpen={isOpen} isOverlay={false} onToggle={setIsOpen}>
          <div>assistant</div>
        </AiSidePanel>
      );
    };
    render(<Toggled />);
    expect(screen.getByRole('button', { name: 'QueryBuilder.AiPanelExpand' })).not.toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.AiPanelExpand' }));
    expect(await screen.findByRole('button', { name: 'QueryBuilder.AiPanelCollapse' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.AiPanelCollapse' }));
    expect(await screen.findByRole('button', { name: 'QueryBuilder.AiPanelExpand' })).toHaveFocus();
  });
});
