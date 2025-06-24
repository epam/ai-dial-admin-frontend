import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import TagInput from '../TagInput';

describe('Components :: TagInput', () => {
  test('Should render correctly', () => {
    render(<TagInput />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
