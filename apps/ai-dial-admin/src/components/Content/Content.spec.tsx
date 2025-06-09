import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import Content from './Content';

describe('Components - Content', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <Content isEnableAuth={true} beVersion={'1.0.0'} feVersion={'1.0.0'}>
        <div>content</div>
      </Content>,
    );

    expect(baseElement).toBeTruthy();
  });
});
