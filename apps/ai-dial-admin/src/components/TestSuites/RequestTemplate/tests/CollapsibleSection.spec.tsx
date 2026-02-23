import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import CollapsibleSection from '../components/CollapsibleSection';

describe('CollapsibleSection', () => {
  const title = 'Test Section';
  const childContent = 'Child content';

  test('renders title', () => {
    render(
      <CollapsibleSection title={title}>
        <p>{childContent}</p>
      </CollapsibleSection>,
    );

    expect(screen.getByText(title)).toBeInTheDocument();
  });

  test('renders children when defaultOpen is true (default)', () => {
    render(
      <CollapsibleSection title={title}>
        <p>{childContent}</p>
      </CollapsibleSection>,
    );

    expect(screen.getByText(childContent)).toBeInTheDocument();
  });

  test('hides children when defaultOpen is false', () => {
    render(
      <CollapsibleSection title={title} defaultOpen={false}>
        <p>{childContent}</p>
      </CollapsibleSection>,
    );

    expect(screen.queryByText(childContent)).not.toBeInTheDocument();
  });

  test('toggles children visibility on title click', () => {
    render(
      <CollapsibleSection title={title}>
        <p>{childContent}</p>
      </CollapsibleSection>,
    );

    expect(screen.getByText(childContent)).toBeInTheDocument();

    fireEvent.click(screen.getByText(title));
    expect(screen.queryByText(childContent)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(title));
    expect(screen.getByText(childContent)).toBeInTheDocument();
  });

  test('opens collapsed section on title click', () => {
    render(
      <CollapsibleSection title={title} defaultOpen={false}>
        <p>{childContent}</p>
      </CollapsibleSection>,
    );

    expect(screen.queryByText(childContent)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(title));
    expect(screen.getByText(childContent)).toBeInTheDocument();
  });

  test('applies rotate class to chevron when collapsed', () => {
    const { container } = render(
      <CollapsibleSection title={title} defaultOpen={false}>
        <p>{childContent}</p>
      </CollapsibleSection>,
    );

    const chevron = container.querySelector('svg');
    expect(chevron).toHaveClass('-rotate-90');
  });

  test('does not apply rotate class to chevron when open', () => {
    const { container } = render(
      <CollapsibleSection title={title}>
        <p>{childContent}</p>
      </CollapsibleSection>,
    );

    const chevron = container.querySelector('svg');
    expect(chevron).not.toHaveClass('-rotate-90');
  });

  test('applies flex-1 class when growOnOpen is true and section is open', () => {
    const { container } = render(
      <CollapsibleSection title={title} growOnOpen>
        <p>{childContent}</p>
      </CollapsibleSection>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass('flex-1');
  });

  test('does not apply flex-1 to wrapper when growOnOpen is false', () => {
    const { container } = render(
      <CollapsibleSection title={title}>
        <p>{childContent}</p>
      </CollapsibleSection>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper).not.toHaveClass('flex-1');
  });

  test('does not apply flex-1 to wrapper when growOnOpen is true but section is closed', () => {
    const { container } = render(
      <CollapsibleSection title={title} growOnOpen defaultOpen={false}>
        <p>{childContent}</p>
      </CollapsibleSection>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper).not.toHaveClass('flex-1');
  });

  test('applies flex-1 to children container when growOnOpen is true', () => {
    render(
      <CollapsibleSection title={title} growOnOpen>
        <p>{childContent}</p>
      </CollapsibleSection>,
    );

    const childContainer = screen.getByText(childContent).parentElement;
    expect(childContainer).toHaveClass('flex-1');
  });

  test('does not apply flex-1 to children container when growOnOpen is false', () => {
    render(
      <CollapsibleSection title={title}>
        <p>{childContent}</p>
      </CollapsibleSection>,
    );

    const childContainer = screen.getByText(childContent).parentElement;
    expect(childContainer).not.toHaveClass('flex-1');
  });
});
