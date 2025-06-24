import { DialModel, DialModelType } from '@/src/models/dial/model';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { fireEvent } from '@testing-library/dom';
import { describe, expect, test } from 'vitest';
import ModelTypeProperties from './ModelTypeProperties';

describe('ModelProperties :: ModelTypeProperties', () => {
  test('Should render successfully', () => {
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
