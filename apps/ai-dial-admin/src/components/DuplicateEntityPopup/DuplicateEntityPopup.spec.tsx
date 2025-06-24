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
      name: 'deploymentId',
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
        view={ApplicationRoute.Applications}
        entity={entity}
      />,
    );
    expect(baseElement).toBeTruthy();

    const deploymentId = getByTestId('deploymentId');
    expect(entity.name).toBe('deploymentId');
    fireEvent.change(deploymentId, { target: { value: 'New deploymentId' } });

    const displayVersion = getByTestId('version');
    expect((entity as DialBaseEntity).displayVersion).toBe('displayVersion');
    fireEvent.change(displayVersion, { target: { value: 'New displayVersion' } });

    const displayName = getByTestId('name');
    expect((entity as DialBaseEntity).displayName).toBe('displayName');
    fireEvent.change(displayName, { target: { value: 'New displayName' } });

    fireEvent.click(getByTestId('duplicateBtn'));

    expect(entity.name).toBe('New deploymentId');
    expect((entity as DialBaseEntity).displayVersion).toBe('New displayVersion');

    fireEvent.click(getByTestId('cancelBtn'));
  });
});
