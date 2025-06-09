import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import ModelTypeProperties from './ModelTypeProperties';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { fireEvent } from '@testing-library/dom';

describe('ModelProperties :: ModelTypeProperties', () => {
  it('Should render successfully', () => {
    let model = { type: DialModelType.Chat, overrideName: 'Override Name', topics: [] } as DialModel;
    const onChangeModel = (m: DialModel) => {
      model = m;
    };
    const { baseElement, getByTestId } = renderWithContext(
      <ModelTypeProperties model={model} onChangeModel={onChangeModel} />,
    );

    expect(baseElement).toBeTruthy();

    const overrideNameControl = getByTestId('overrideName');
    expect(model.overrideName).toBe('Override Name');
    fireEvent.change(overrideNameControl, { target: { value: 'New Override Name' } });
    expect(model.overrideName).toBe('New Override Name');
  });
});
