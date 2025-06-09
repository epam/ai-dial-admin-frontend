import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import LoadFileAreaField from './LoadFileAreaField';

describe('Common components :: LoadFileArea ', () => {
  it('Should render successfully with empty file', () => {
    const { baseElement } = renderWithContext(
      <LoadFileAreaField
        fieldTitle="title"
        elementId="fieldTitle"
        acceptTypes="acceptTypes"
        emptyTitle="emptyTitle"
        fileUrl="fileUrl"
        onChangeFile={jest.fn()}
      />,
    );

    expect(baseElement).toBeTruthy();
  });
});
