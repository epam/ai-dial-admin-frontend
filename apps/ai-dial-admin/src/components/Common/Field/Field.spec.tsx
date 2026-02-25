import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Field from './Field';
import { BasicI18nKey } from '@/src/constants/i18n';

describe('Common components :: Field', () => {
  test('Should render label with fieldTitle', () => {
    render(<Field fieldTitle="My Field" htmlFor="input-id" />);
    const label = screen.getByText('My Field');
    expect(label).toBeInTheDocument();
    expect(label.tagName.toLowerCase()).toBe('span');
  });

  test('Should render (Optional) when optional is true', () => {
    render(<Field htmlFor="input" fieldTitle="My Field" optional />);
    expect(screen.getByText(`(${BasicI18nKey.Optional})`)).toBeInTheDocument();
  });

  test('Should render nothing when fieldTitle is not provided', () => {
    const { container } = render(<Field htmlFor="input" />);
    expect(container).toBeEmptyDOMElement();
  });
});
