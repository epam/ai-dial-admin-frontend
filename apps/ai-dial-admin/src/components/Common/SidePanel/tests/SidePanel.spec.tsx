import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import SidePanel from '../SidePanel';

describe('SidePanel', () => {
  test('renders nothing when isOpen is false', () => {
    const { container } = render(
      <SidePanel label="Details" isOpen={false} onClose={vi.fn()}>
        <p>Body content</p>
      </SidePanel>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('renders label and children when isOpen is true', () => {
    render(
      <SidePanel label="Details" isOpen={true} onClose={vi.fn()}>
        <p>Body content</p>
      </SidePanel>,
    );
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  test('invokes onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <SidePanel label="Details" isOpen={true} onClose={onClose}>
        <p>Body</p>
      </SidePanel>,
    );
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('applies className override to outer container', () => {
    const { container } = render(
      <SidePanel label="Details" isOpen={true} onClose={vi.fn()} className="custom-class">
        <p>Body</p>
      </SidePanel>,
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  test('accepts ReactNode label', () => {
    render(
      <SidePanel label={<span>Custom label node</span>} isOpen={true} onClose={vi.fn()}>
        <p>Body</p>
      </SidePanel>,
    );
    expect(screen.getByText('Custom label node')).toBeInTheDocument();
  });
});
