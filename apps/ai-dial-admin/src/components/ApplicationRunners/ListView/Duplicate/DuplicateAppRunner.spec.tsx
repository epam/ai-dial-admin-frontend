import { DialApplicationScheme } from '@/src/models/dial/application';
import { PopUpState } from '@/src/types/pop-up';
import { render } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import DuplicateScheme from './DuplicateAppRunner';
import { describe, expect, test, vi } from 'vitest';

describe('Components :: DuplicateScheme', () => {
  let scheme = {
    'dial:applicationTypeDisplayName': 'name',
    'dial:applicationTypeCompletionEndpoint': 'endpoint',
    'dial:applicationTypeViewerUrl': 'url',
    'dial:applicationTypeEditorUrl': 'url',
    $id: 'id',
  } as DialApplicationScheme;

  const onDuplicate = (en: DialApplicationScheme) => {
    scheme = en;
  };

  test('Should render successfully', () => {
    const { baseElement, getByTestId } = render(
      <DuplicateScheme entity={scheme} onDuplicate={onDuplicate} onClose={vi.fn()} modalState={PopUpState.Opened} />,
    );

    expect(baseElement).toBeTruthy();

    const id = getByTestId('id');
    expect(scheme.$id).toBe('id');
    fireEvent.change(id, { target: { value: 'New id' } });

    fireEvent.click(getByTestId('duplicateBtn'));

    expect(scheme.$id).toBe('New id');

    fireEvent.click(getByTestId('cancelBtn'));
  });
});
