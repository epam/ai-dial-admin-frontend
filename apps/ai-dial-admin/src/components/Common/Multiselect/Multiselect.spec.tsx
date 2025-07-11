import { render } from '@testing-library/react';
import Multiselect from './Multiselect';
import MultiselectModal from './MultiselectModal';
import NewItemInput from './NewItemInput';
import { PopUpState } from '@/src/types/pop-up';
import { describe, expect, test, vi } from 'vitest';

describe('Common components - Multiselect', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <Multiselect elementId="test" heading="title" title="title" onChangeItems={vi.fn()} />,
    );

    expect(baseElement).toBeTruthy();
  });
});

describe('Common components - MultiselectModal', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <MultiselectModal
        heading="title"
        allItems={[]}
        modalState={PopUpState.Opened}
        onClose={vi.fn()}
        onSelectItems={vi.fn()}
        addTitle="title"
      />,
    );

    expect(baseElement).toBeTruthy();
  });
});

describe('Common components - NewItemInput', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <NewItemInput index={0} value="test" onChangeItem={vi.fn()} onRemoveItem={vi.fn()} placeholder="test" />,
    );

    expect(baseElement).toBeTruthy();
  });
});
