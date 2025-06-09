import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import Multiselect from './Multiselect';
import MultiselectModal from './MultiselectModal';
import NewItemInput from './NewItemInput';
import { PopUpState } from '@/src/types/pop-up';

describe('Common components - Multiselect', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <Multiselect elementId="test" heading="title" title="title" onChangeItems={jest.fn()} />,
    );

    expect(baseElement).toBeTruthy();
  });
});

describe('Common components - MultiselectModal', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <MultiselectModal
        heading="title"
        allItems={[]}
        modalState={PopUpState.Opened}
        onClose={jest.fn()}
        onSelectItems={jest.fn()}
        addTitle="title"
      />,
    );

    expect(baseElement).toBeTruthy();
  });
});

describe('Common components - NewItemInput', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <NewItemInput index={0} value="test" onChangeItem={jest.fn()} onRemoveItem={jest.fn()} placeholder="test" />,
    );

    expect(baseElement).toBeTruthy();
  });
});
