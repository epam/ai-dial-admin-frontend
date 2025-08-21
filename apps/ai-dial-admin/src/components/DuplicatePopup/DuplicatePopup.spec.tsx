import { fireEvent, render } from '@testing-library/react';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import DuplicateEntityPopup from './DuplicateEntityPopup';
import { DialBaseEntity, DialBaseNamedEntity } from '@/src/models/dial/base-entity';
import { describe, expect, test, vi } from 'vitest';
const mockFunction = vi.fn();

describe('EntityView :: DuplicateEntityPopup', () => {
  test('Should render empty successfully', () => {
    const { baseElement } = render(
      <DuplicateEntityPopup
        modalState={PopUpState.Opened}
        onDuplicate={mockFunction}
        onClose={mockFunction}
        view={ApplicationRoute.Keys}
        entity={{}}
      />,
    );
    expect(baseElement).toBeTruthy();
  });
  test('Should render successfully', () => {
    let entity = {
      name: 'name',
      displayVersion: 'displayVersion',
      displayName: 'displayName',
    } as DialBaseEntity | DialBaseNamedEntity;
    const onDuplicate = (en: DialBaseEntity | DialBaseNamedEntity) => {
      entity = en;
    };

    const { baseElement, getByTestId } = render(
      <DuplicateEntityPopup
        modalState={PopUpState.Opened}
        onDuplicate={onDuplicate}
        onClose={mockFunction}
        names={[]}
        view={ApplicationRoute.Applications}
        entity={entity}
      />,
    );
    expect(baseElement).toBeTruthy();

    const name = getByTestId('id');
    expect(entity.name).toBe('name');
    fireEvent.change(name, { target: { value: 'New name' } });

    const displayName = getByTestId('name');
    expect((entity as DialBaseEntity).displayName).toBe('displayName');
    fireEvent.change(displayName, { target: { value: 'New displayName' } });

    fireEvent.click(getByTestId('duplicateBtn'));

    expect(entity.name).toBe('New name');
    fireEvent.click(getByTestId('cancelBtn'));
  });
});
