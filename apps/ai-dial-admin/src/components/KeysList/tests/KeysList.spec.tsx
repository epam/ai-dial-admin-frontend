import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { fireEvent } from '@testing-library/dom';
import { DialKey } from '../../../models/dial/key';
import KeyProperties from '../KeyProperties';
import KeysList from '../KeysList';
import KeyView from '../KeyView';

jest.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, jest.fn()],
  useDrop: () => [{ isOver: false }, jest.fn()],
}));

describe('KeysList - List view', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(<KeysList data={[{ key: 'key', project: 'project', secured: false }]} />);
    expect(baseElement).toBeTruthy();
  });
});

describe('KeyView - view', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <KeyView names={[]} originalKey={{ key: 'key', project: 'project', secured: false }} roles={[]} />,
    );
    expect(baseElement).toBeTruthy();
  });
});

describe('KeyView - KeyProperties', () => {
  it('Should render successfully', () => {
    let entity = { key: 'key', project: 'project', name: 'key', secured: true, description: 'description' };
    const onChangeKey = (key: DialKey) => {
      entity = { ...entity, ...key };
    };
    const { baseElement, getByTestId } = renderWithContext(
      <KeyProperties entity={entity} names={['key']} onChangeKey={onChangeKey} isKeyImmutable={false} />,
    );
    expect(baseElement).toBeTruthy();

    const descriptionControl = getByTestId('description');
    expect(entity.description).toBe('description');
    fireEvent.change(descriptionControl, { target: { value: 'new description' } });
    expect(entity.description).toBe('new description');
  });
});
