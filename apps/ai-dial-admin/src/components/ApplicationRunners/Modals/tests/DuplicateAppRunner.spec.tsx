import { DialApplicationScheme } from '@/src/models/dial/application';
import { PopUpState } from '@/src/types/pop-up';
import { render } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import DuplicateScheme from '@/src/components/ApplicationRunners/Modals/DuplicateAppRunner';
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
    const { baseElement } = render(
      <DuplicateScheme entity={scheme} onDuplicate={onDuplicate} onClose={vi.fn()} modalState={PopUpState.Opened} />,
    );

    expect(baseElement).toBeTruthy();
  });
});
