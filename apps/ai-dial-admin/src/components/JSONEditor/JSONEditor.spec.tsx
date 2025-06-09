import Editor from '@monaco-editor/react';
import JSONEditor from '@/src/components/JSONEditor/JSONEditor';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { modelMock } from '@/src/utils/tests/mock/models.mock';

describe('Components - JSONEditor', () => {
  const handleBeforeMount = jest.fn();
  const setSelectedEntity = jest.fn();

  it('Should render JSONEditor', () => {
    const { baseElement } = renderWithContext(
      <JSONEditor model={modelMock} errorNotifications={[]} setSelectedEntity={setSelectedEntity} />,
    );

    expect(baseElement).toBeTruthy();
  });

  // https://github.com/suren-atoyan/monaco-react/issues/88
  xit('Should call handleBeforeMount', () => {
    renderWithContext(<Editor value={JSON.stringify(modelMock)} beforeMount={handleBeforeMount} />);

    expect(handleBeforeMount).toHaveBeenCalled();
  });
});
