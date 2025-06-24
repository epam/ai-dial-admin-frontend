import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Tag from '../Tag';

describe('Components :: Tag', () => {
  test('Should render correctly', () => {
    render(<Tag tag="tag" />);
    expect(screen.getByText('tag')).toBeInTheDocument();
  });
});
