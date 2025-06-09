import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import InterceptorView from './InterceptorView';

describe('Interceptor View', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <InterceptorView
        names={[]}
        originalInterceptor={{ name: 'interceptor' }}
        addons={[]}
        applications={[]}
        models={[]}
      />,
    );
    expect(baseElement).toBeTruthy();
  });
});
