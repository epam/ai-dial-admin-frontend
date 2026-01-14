import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tool from '../Tool/Tool';
import { Tool as ToolType } from '@/src/models/dial/toolset';

describe('Tool', () => {
  const mockTool: ToolType = {
    name: 'Test Tool',
    description: 'Test tool description',
    inputSchema: {
      type: 'object',
      properties: {
        param1: { type: 'string' },
        param2: { type: 'number' },
      },
    },
    annotations: {
      title: 'Test Annotation',
      readOnlyHint: false,
    },
  };

  test('renders tool name', () => {
    render(<Tool tool={mockTool} />);
    expect(screen.getByText('Test Tool')).toBeInTheDocument();
  });

  test('starts collapsed by default', () => {
    render(<Tool tool={mockTool} />);
    expect(screen.queryByText('Test tool description')).not.toBeInTheDocument();
  });

  test('expands when clicked', async () => {
    const user = userEvent.setup();
    render(<Tool tool={mockTool} />);

    const button = screen.getAllByRole('button');
    await user.click(button[0]);

    expect(screen.getByText('Test tool description')).toBeInTheDocument();
  });

  test('collapses when clicked again', async () => {
    const user = userEvent.setup();
    render(<Tool tool={mockTool} />);

    const button = screen.getAllByRole('button');
    await user.click(button[0]);
    expect(screen.getByText('Test tool description')).toBeInTheDocument();

    await user.click(button[0]);
    expect(screen.queryByText('Test tool description')).not.toBeInTheDocument();
  });

  test('renders without description', () => {
    const toolWithoutDescription = { ...mockTool, description: undefined };
    render(<Tool tool={toolWithoutDescription} />);

    expect(screen.getByText('Test Tool')).toBeInTheDocument();
  });

  test('renders without annotations', () => {
    const toolWithoutAnnotations = { ...mockTool, annotations: undefined };
    render(<Tool tool={toolWithoutAnnotations} />);

    expect(screen.getByText('Test Tool')).toBeInTheDocument();
  });
});
