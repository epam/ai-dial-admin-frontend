import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import ExportConfig from '../ExportConfig';

describe('ExportConfig', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(<ExportConfig />);
    expect(baseElement).toBeTruthy();
  });
});
