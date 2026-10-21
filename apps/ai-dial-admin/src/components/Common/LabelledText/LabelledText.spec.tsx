import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import LabelledText from './LabelledText';

describe('LabelledText', () => {
  test('renders label and text', () => {
    render(<LabelledText label="Test Label" text="Test Text" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('Test Text')).toBeInTheDocument();
  });

  test('renders children instead of text if provided', () => {
    render(
      <LabelledText label="Child Label">
        <span>Child Content</span>
      </LabelledText>,
    );
    expect(screen.getByText('Child Content')).toBeInTheDocument();
    expect(screen.getByText('Child Label')).toBeInTheDocument();
  });

  test('renders copy button if copyButton is true', () => {
    render(<LabelledText label="Copy Label" text="Copy Text" copyable />);
    // The control names the value it copies, so several of them in one view stay distinguishable.
    expect(screen.getByLabelText('copy Copy Label')).toBeInTheDocument();
  });

  test('renders without text', () => {
    render(<LabelledText label="No Text" />);
    expect(screen.getByText('No Text')).toBeInTheDocument();
  });
});
