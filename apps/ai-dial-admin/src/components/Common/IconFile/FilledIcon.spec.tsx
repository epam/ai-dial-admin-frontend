import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import FilledIcon from './FilledIcon';

describe('Common components :: FilledIcon', () => {
  test('Should render image and context menu', () => {
    render(<FilledIcon fileUrl="/test.png" onChange={vi.fn()} />);
    expect(screen.getByAltText('entityImage')).toBeInTheDocument();
  });
});
