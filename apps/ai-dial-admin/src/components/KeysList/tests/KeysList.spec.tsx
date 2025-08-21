import { render } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { DialKey } from '../../../models/dial/key';
import KeyProperties from '../KeyProperties';
import KeysList from '../KeysList';
import KeyView from '../KeyView';
import { describe, expect, test, vi } from 'vitest';

vi.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, vi.fn()],
  useDrop: () => [{ isOver: false }, vi.fn()],
}));

describe('KeysList - List view', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<KeysList data={[{ key: 'key', project: 'project', secured: false }]} />);
    expect(baseElement).toBeTruthy();
  });
});

describe('KeyView - view', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <KeyView names={[]} originalKey={{ key: 'key', project: 'project', secured: false }} roles={[]} />,
    );
    expect(baseElement).toBeTruthy();
  });
});
