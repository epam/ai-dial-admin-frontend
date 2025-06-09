import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import CreateEntity from './CreateEntity';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';

describe('CreateEntity', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <CreateEntity
        route={ApplicationRoute.Models}
        modalTitle="title"
        createEntity={jest.fn()}
        onClose={jest.fn()}
        names={[]}
        modalState={PopUpState.Opened}
      />,
    );
    expect(baseElement).toBeTruthy();
  });

  it('Should render successfully Prompts', () => {
    const { baseElement } = renderWithContext(
      <CreateEntity
        route={ApplicationRoute.Prompts}
        modalTitle="title"
        createEntity={jest.fn()}
        onClose={jest.fn()}
        names={[]}
        versionsMap={{}}
        modalState={PopUpState.Opened}
      />,
    );
    expect(baseElement).toBeTruthy();
  });

  it('Should render successfully Keys', () => {
    const { baseElement } = renderWithContext(
      <CreateEntity
        route={ApplicationRoute.Keys}
        modalTitle="title"
        createEntity={jest.fn()}
        onClose={jest.fn()}
        names={[]}
        versionsMap={{}}
        modalState={PopUpState.Opened}
      />,
    );
    expect(baseElement).toBeTruthy();
  });
});
