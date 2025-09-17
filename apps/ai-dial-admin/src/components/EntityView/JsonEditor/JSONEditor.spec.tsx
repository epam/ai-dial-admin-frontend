import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import JSONEditor from './JsonEditor';

const entity = { id: '1', name: 'Test Entity' };
const mockSetSelectedEntity = vi.fn();

describe('JSONEditor', () => {
  it('renders JsonEditorBase when model is provided', () => {
    render(<JSONEditor entity={entity} setSelectedEntity={mockSetSelectedEntity} />);
    // Should render `Loading...` from JsonEditorBase
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders nothing if model is not provided', () => {
    // @ts-expect-error purposely omitting model
    const { container } = render(<JSONEditor setSelectedEntity={mockSetSelectedEntity} />);
    expect(container.firstChild).toBeNull();
  });
});
