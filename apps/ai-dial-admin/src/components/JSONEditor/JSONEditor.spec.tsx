import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import JSONEditor from './JSONEditor';

const entity = { id: '1', name: 'Test Entity' };
const mockSetSelectedEntity = vi.fn();

describe('JSONEditor', () => {
  it('renders JsonEditorBase when model is provided', () => {
    const { container } = render(
      <JSONEditor entity={entity} errorNotifications={[]} setSelectedEntity={mockSetSelectedEntity} />,
    );
    // Should render a textarea or input from JsonEditorBase
    expect(container.querySelector('textarea,input')).toBeTruthy();
  });

  it('renders nothing if model is not provided', () => {
    // @ts-expect-error purposely omitting model
    const { container } = render(<JSONEditor errorNotifications={[]} setSelectedEntity={mockSetSelectedEntity} />);
    expect(container.firstChild).toBeNull();
  });
});
