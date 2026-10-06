import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import CopyableText from '@/src/components/Common/CopyableText/CopyableText';

describe('CopyableText', () => {
  test('renders the value followed by its copy control', () => {
    render(<CopyableText value="sess_A" copyLabel="Group key" />);

    const text = screen.getByText('sess_A');
    const control = screen.getByRole('button', { name: 'copy Group key' });

    expect(text.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
